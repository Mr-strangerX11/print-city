import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { Cart, CartSchema } from './schemas/cart.schema';
import { CartItem, CartItemSchema } from './schemas/cart-item.schema';
import { ProductVariant, ProductVariantSchema } from '../products/schemas/product-variant.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { ProductImage, ProductImageSchema } from '../products/schemas/product-image.schema';
import { Vendor, VendorSchema } from '../vendors/schemas/vendor.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: CartItem.name, schema: CartItemSchema },
      { name: ProductVariant.name, schema: ProductVariantSchema },
      { name: Product.name, schema: ProductSchema },
      { name: ProductImage.name, schema: ProductImageSchema },
      { name: Vendor.name, schema: VendorSchema },
    ]),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
