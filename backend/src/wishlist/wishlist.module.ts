import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';
import { WishlistItem, WishlistItemSchema } from './schemas/wishlist-item.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { ProductImage, ProductImageSchema } from '../products/schemas/product-image.schema';
import { ProductVariant, ProductVariantSchema } from '../products/schemas/product-variant.schema';
import { Vendor, VendorSchema } from '../vendors/schemas/vendor.schema';
import { Category, CategorySchema } from '../categories/schemas/category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WishlistItem.name, schema: WishlistItemSchema },
      { name: Product.name, schema: ProductSchema },
      { name: ProductImage.name, schema: ProductImageSchema },
      { name: ProductVariant.name, schema: ProductVariantSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}
