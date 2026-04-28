import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Cart extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ type: [], default: [] })
  items: Array<any>;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

@Schema({ timestamps: true })
export class CartItem extends Document {
  @Prop({ required: true })
  cartId: string;

  @Prop({ required: true })
  productId: string;

  @Prop()
  variantId: string;

  @Prop({ default: 1 })
  quantity: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);
