import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderItemDocument = OrderItem & Document;

@Schema({ timestamps: true })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true }) orderId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true }) productId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'ProductVariant', required: true }) variantId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true }) vendorId: Types.ObjectId;
  @Prop({ required: true }) qty: number;
  @Prop({ required: true }) price: number;
  @Prop({ required: true }) vendorCommission: number;
  @Prop({ required: true }) adminAmount: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
