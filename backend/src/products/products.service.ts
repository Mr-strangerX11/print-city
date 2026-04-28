import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductStatus } from '../common/enums';
import { Role } from '../user/schemas/user.schema';
import slugify from 'slugify';
import { parse } from 'csv-parse/sync';
import { Product, ProductDocument } from './schemas/product.schema';
import { ProductVariant, ProductVariantDocument } from './schemas/product-variant.schema';
import { ProductImage, ProductImageDocument } from './schemas/product-image.schema';
import { Vendor, VendorDocument } from '../vendors/schemas/vendor.schema';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';

interface QueryParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  status?: ProductStatus;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(ProductVariant.name) private variantModel: Model<ProductVariantDocument>,
    @InjectModel(ProductImage.name) private imageModel: Model<ProductImageDocument>,
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async findAll(query: QueryParams, userId?: string, userRole?: Role) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (!userId || userRole === Role.CUSTOMER) {
      filter.status = ProductStatus.ACTIVE;
    } else if (userRole === Role.VENDOR) {
      const vendor = await this.vendorModel.findOne({ userId: new Types.ObjectId(userId) }).lean().exec();
      if (vendor) filter.vendorId = vendor._id;
    }

    if (query.status && userRole === Role.ADMIN) filter.status = query.status;

    if (query.category) {
      const cat = await this.categoryModel.findOne({ slug: query.category }).lean().exec();
      if (cat) filter.categoryId = cat._id;
    }

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { tags: query.search },
      ];
    }

    if (query.minPrice || query.maxPrice) {
      filter.basePrice = {};
      if (query.minPrice) filter.basePrice.$gte = Number(query.minPrice);
      if (query.maxPrice) filter.basePrice.$lte = Number(query.maxPrice);
    }

    let sortObj: any = { createdAt: -1 };
    switch (query.sort) {
      case 'price_asc': sortObj = { basePrice: 1 }; break;
      case 'price_desc': sortObj = { basePrice: -1 }; break;
      case 'oldest': sortObj = { createdAt: 1 }; break;
    }

    const [items, total] = await Promise.all([
      this.productModel.find(filter).sort(sortObj).skip(skip).limit(limit).lean().exec(),
      this.productModel.countDocuments(filter),
    ]);

    // Enrich with images, variants, vendor, category
    const enriched = await Promise.all(
      items.map(async (p) => {
        const [primaryImage, variants, vendor, category] = await Promise.all([
          this.imageModel.findOne({ productId: p._id, isPrimary: true }).lean().exec(),
          this.variantModel.find({ productId: p._id }, { price: 1, color: 1, size: 1 }).lean().exec(),
          this.vendorModel.findById(p.vendorId, { storeName: 1, storeSlug: 1 }).lean().exec(),
          p.categoryId ? this.categoryModel.findById(p.categoryId, { name: 1, slug: 1 }).lean().exec() : null,
        ]);
        return { ...p, images: primaryImage ? [primaryImage] : [], variants, vendor, category };
      }),
    );

    return {
      items: enriched,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findBySlug(slug: string) {
    const product = await this.productModel.findOne({ slug }).lean().exec();
    if (!product) throw new NotFoundException('Product not found');

    const [images, variants, vendor, category] = await Promise.all([
      this.imageModel.find({ productId: product._id }).lean().exec(),
      this.variantModel.find({ productId: product._id }).lean().exec(),
      this.vendorModel.findById(product.vendorId, { storeName: 1, storeSlug: 1, logo: 1, description: 1 }).lean().exec(),
      product.categoryId ? this.categoryModel.findById(product.categoryId).lean().exec() : null,
    ]);

    return { ...product, images, variants, vendor, category };
  }

  async create(dto: CreateProductDto, userId: string) {
    const vendor = await this.vendorModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (!vendor) throw new ForbiddenException('Vendor profile not found');

    const slug = await this.generateUniqueSlug(dto.title);

    const product = await this.productModel.create({
      vendorId: vendor._id,
      categoryId: dto.categoryId ? new Types.ObjectId(dto.categoryId) : undefined,
      title: dto.title,
      slug,
      description: dto.description,
      basePrice: dto.basePrice,
      status: ProductStatus.PENDING_APPROVAL,
      tags: dto.tags ?? [],
    });

    const [variants, images] = await Promise.all([
      dto.variants ? this.variantModel.insertMany(dto.variants.map(v => ({ ...v, productId: product._id }))) : [],
      dto.imageUrls
        ? this.imageModel.insertMany(
            dto.imageUrls.map((url, i) => ({ url, isPrimary: i === 0, productId: product._id })),
          )
        : [],
    ]);

    return { ...product.toObject(), variants, images };
  }

  async update(id: string, dto: Partial<CreateProductDto>, userId: string, role: Role) {
    const product = await this.productModel.findById(id).lean().exec();
    if (!product) throw new NotFoundException('Product not found');

    if (role === Role.VENDOR) {
      const vendor = await this.vendorModel.findById(product.vendorId).lean().exec();
      if (!vendor || vendor.userId.toString() !== userId) throw new ForbiddenException();
    }

    const updateData: any = {};
    if (dto.title) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.basePrice) updateData.basePrice = dto.basePrice;
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId ? new Types.ObjectId(dto.categoryId) : null;
    if (dto.status) updateData.status = dto.status;
    if (dto.tags) updateData.tags = dto.tags;

    const updated = await this.productModel.findByIdAndUpdate(id, updateData, { new: true }).lean().exec();
    const [variants, images] = await Promise.all([
      this.variantModel.find({ productId: new Types.ObjectId(id) }).lean().exec(),
      this.imageModel.find({ productId: new Types.ObjectId(id) }).lean().exec(),
    ]);

    return { ...updated, variants, images };
  }

  async importCsv(fileBuffer: Buffer, adminId: string): Promise<{ created: number; errors: string[] }> {
    const rows = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    const errors: string[] = [];
    let created = 0;

    const firstVendor = await this.vendorModel.findOne({ status: 'ACTIVE' }).lean().exec();
    if (!firstVendor) throw new BadRequestException('No active vendor found for import');

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.title || !row.basePrice) {
          errors.push(`Row ${i + 2}: Missing required fields (title, basePrice)`);
          continue;
        }

        const slug = await this.generateUniqueSlug(row.title);
        let categoryId: Types.ObjectId | undefined;
        if (row.category) {
          const cat = await this.categoryModel.findOne({ name: { $regex: `^${row.category}$`, $options: 'i' } }).lean().exec();
          if (cat) categoryId = cat._id as Types.ObjectId;
        }

        const product = await this.productModel.create({
          vendorId: firstVendor._id,
          categoryId,
          title: row.title,
          slug,
          description: row.description ?? '',
          basePrice: parseFloat(row.basePrice),
          status: ProductStatus.ACTIVE,
          tags: row.tags ? row.tags.split('|').map((t) => t.trim()) : [],
        });

        if (row.imageUrl) {
          await this.imageModel.create({ productId: product._id, url: row.imageUrl, isPrimary: true });
        }

        created++;
      } catch (err: any) {
        errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    return { created, errors };
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    let slug = slugify(title, { lower: true, strict: true });
    let count = 0;
    while (true) {
      const candidate = count === 0 ? slug : `${slug}-${count}`;
      const existing = await this.productModel.findOne({ slug: candidate }).lean().exec();
      if (!existing) return candidate;
      count++;
    }
  }
}
