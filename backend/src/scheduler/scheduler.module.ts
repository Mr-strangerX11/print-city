import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { SchedulerService } from './scheduler.service';
import { MailModule } from '../mail/mail.module';
import { Cart, CartSchema } from '../cart/schemas/cart.schema';
import { CartItem, CartItemSchema } from '../cart/schemas/cart-item.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { ProductVariant, ProductVariantSchema } from '../products/schemas/product-variant.schema';
import { ProductImage, ProductImageSchema } from '../products/schemas/product-image.schema';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MailModule,
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: CartItem.name, schema: CartItemSchema },
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
      { name: ProductVariant.name, schema: ProductVariantSchema },
      { name: ProductImage.name, schema: ProductImageSchema },
    ]),
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
