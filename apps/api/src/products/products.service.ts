import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductStatus, Role } from '@prisma/client';
import slugify from 'slugify';
import { parse } from 'csv-parse/sync';

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
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryParams, userId?: string, userRole?: Role) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    // Public only sees active products
    if (!userId || userRole === Role.CUSTOMER) {
      where.status = ProductStatus.ACTIVE;
    } else if (userRole === Role.VENDOR) {
      // Vendor sees own products
      const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
      if (vendor) where.vendorId = vendor.id;
    }
    // Admin sees all

    if (query.status && userRole === Role.ADMIN) where.status = query.status;
    if (query.category) {
      const cat = await this.prisma.category.findUnique({ where: { slug: query.category } });
      if (cat) where.categoryId = cat.id;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search } },
      ];
    }
    if (query.minPrice || query.maxPrice) {
      where.basePrice = {};
      if (query.minPrice) where.basePrice.gte = query.minPrice;
      if (query.maxPrice) where.basePrice.lte = query.maxPrice;
    }

    const orderBy: any = {};
    switch (query.sort) {
      case 'price_asc':
        orderBy.basePrice = 'asc';
        break;
      case 'price_desc':
        orderBy.basePrice = 'desc';
        break;
      case 'oldest':
        orderBy.createdAt = 'asc';
        break;
      default:
        orderBy.createdAt = 'desc';
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          variants: { select: { price: true, color: true, size: true } },
          vendor: { select: { storeName: true, storeSlug: true } },
          category: { select: { name: true, slug: true } },
          _count: { select: { reviews: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        images: true,
        variants: true,
        vendor: {
          select: {
            storeName: true,
            storeSlug: true,
            logo: true,
            description: true,
            _count: { select: { products: true } },
          },
        },
        category: true,
        reviews: {
          include: { user: { select: { name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { reviews: true } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto, userId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new ForbiddenException('Vendor profile not found');

    const slug = await this.generateUniqueSlug(dto.title);

    return this.prisma.product.create({
      data: {
        vendorId: vendor.id,
        categoryId: dto.categoryId || undefined,
        title: dto.title,
        slug,
        description: dto.description,
        basePrice: dto.basePrice,
        status: ProductStatus.PENDING_APPROVAL,
        tags: dto.tags ?? [],
        variants: dto.variants
          ? { create: dto.variants }
          : undefined,
        images: dto.imageUrls
          ? {
              create: dto.imageUrls.map((url, i) => ({
                url,
                isPrimary: i === 0,
              })),
            }
          : undefined,
      },
      include: { variants: true, images: true },
    });
  }

  async update(id: string, dto: Partial<CreateProductDto>, userId: string, role: Role) {
    const product = await this.prisma.product.findUnique({ where: { id }, include: { vendor: true } });
    if (!product) throw new NotFoundException('Product not found');

    if (role === Role.VENDOR && product.vendor.userId !== userId) {
      throw new ForbiddenException();
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.basePrice && { basePrice: dto.basePrice }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId || undefined }),
        ...(dto.status && { status: dto.status }),
        ...(dto.tags && { tags: dto.tags }),
      },
      include: { variants: true, images: true },
    });
  }

  async importCsv(fileBuffer: Buffer, adminId: string): Promise<{ created: number; errors: string[] }> {
    const rows = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    const errors: string[] = [];
    let created = 0;

    // Find a vendor to assign — admin-imported products go to admin's vendor or first active vendor
    const firstVendor = await this.prisma.vendor.findFirst({
      where: { status: 'ACTIVE' },
    });
    if (!firstVendor) throw new BadRequestException('No active vendor found for import');

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.title || !row.basePrice) {
          errors.push(`Row ${i + 2}: Missing required fields (title, basePrice)`);
          continue;
        }

        const slug = await this.generateUniqueSlug(row.title);
        let categoryId: string | undefined;
        if (row.category) {
          const cat = await this.prisma.category.findFirst({
            where: { name: { equals: row.category, mode: 'insensitive' } },
          });
          if (cat) categoryId = cat.id;
        }

        await this.prisma.product.create({
          data: {
            vendorId: firstVendor.id,
            categoryId,
            title: row.title,
            slug,
            description: row.description ?? '',
            basePrice: parseFloat(row.basePrice),
            status: ProductStatus.ACTIVE,
            tags: row.tags ? row.tags.split('|').map((t) => t.trim()) : [],
            images: row.imageUrl
              ? { create: [{ url: row.imageUrl, isPrimary: true }] }
              : undefined,
          },
        });
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
      const existing = await this.prisma.product.findUnique({ where: { slug: candidate } });
      if (!existing) return candidate;
      count++;
    }
  }
}
