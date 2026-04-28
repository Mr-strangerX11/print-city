import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WishlistItem, WishlistItemDocument } from './schemas/wishlist-item.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { ProductImage, ProductImageDocument } from '../products/schemas/product-image.schema';
import { ProductVariant, ProductVariantDocument } from '../products/schemas/product-variant.schema';
import { Vendor, VendorDocument } from '../vendors/schemas/vendor.schema';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(WishlistItem.name) private wishlistItemModel: Model<WishlistItemDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(ProductImage.name) private imageModel: Model<ProductImageDocument>,
    @InjectModel(ProductVariant.name) private variantModel: Model<ProductVariantDocument>,
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async getWishlist(userId: string): Promise<any> {
    const uid = new Types.ObjectId(userId);
    const items = await this.wishlistItemModel
      .find({ userId: uid })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return Promise.all(
      items.map(async (item) => {
        const product = await this.productModel.findById(item.productId).lean().exec();
        if (!product) return { ...item, product: null };

        const [primaryImage, variants, vendor, category] = await Promise.all([
          this.imageModel.findOne({ productId: product._id, isPrimary: true }).lean().exec(),
          this.variantModel.find({ productId: product._id }, { price: 1, color: 1, size: 1 }).lean().exec(),
          this.vendorModel.findById(product.vendorId, { storeName: 1, storeSlug: 1 }).lean().exec(),
          product.categoryId ? this.categoryModel.findById(product.categoryId, { name: 1, slug: 1 }).lean().exec() : null,
        ]);

        return {
          ...item,
          product: {
            ...product,
            images: primaryImage ? [primaryImage] : [],
            variants,
            vendor,
            category,
          },
        };
      }),
    );
  }

  async getWishlistProductIds(userId: string): Promise<string[]> {
    const items = await this.wishlistItemModel
      .find({ userId: new Types.ObjectId(userId) }, { productId: 1 })
      .lean()
      .exec();
    return items.map((i) => i.productId.toString());
  }

  async toggle(userId: string, productId: string): Promise<{ added: boolean }> {
    const uid = new Types.ObjectId(userId);
    const pid = new Types.ObjectId(productId);

    const existing = await this.wishlistItemModel.findOne({ userId: uid, productId: pid }).exec();

    if (existing) {
      await this.wishlistItemModel.deleteOne({ userId: uid, productId: pid });
      return { added: false };
    }

    await this.wishlistItemModel.create({ userId: uid, productId: pid });
    return { added: true };
  }

  async remove(userId: string, productId: string) {
    await this.wishlistItemModel.deleteMany({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
    });
    return { removed: true };
  }
}
