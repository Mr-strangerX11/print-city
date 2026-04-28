import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CartItemDocument = CartItem & Document;

@Schema({ timestamps: true })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Cart', required: true }) cartId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'ProductVariant', required: true }) productVariantId: Types.ObjectId;
  @Prop({ default: 1 }) qty: number;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);

CartItemSchema.index({ cartId: 1, productVariantId: 1 }, { unique: true });
