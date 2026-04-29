import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product, ProductSchema } from './schemas/product.schema';
import { ProductVariant, ProductVariantSchema } from './schemas/product-variant.schema';
import { ProductImage, ProductImageSchema } from './schemas/product-image.schema';
import { Vendor, VendorSchema } from '../vendors/schemas/vendor.schema';
import { Category, CategorySchema } from '../categories/schemas/category.schema';
import { WishlistItem, WishlistItemSchema } from '../wishlist/schemas/wishlist-item.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductVariant.name, schema: ProductVariantSchema },
      { name: ProductImage.name, schema: ProductImageSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: Category.name, schema: CategorySchema },
      { name: WishlistItem.name, schema: WishlistItemSchema },
      { name: User.name, schema: UserSchema },
    ]),
    MailModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
