import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  PRINTED = 'PRINTED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, unique: true })
  orderNumber: string;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ default: 0 })
  totalAmount: number;

  @Prop({ default: 0 })
  taxAmount: number;

  @Prop({ default: 0 })
  shippingAmount: number;

  @Prop({ default: 0 })
  discountAmount: number;

  @Prop({ type: [], default: [] })
  items: Array<any>;

  @Prop()
  shippingAddressId: string;

  @Prop()
  couponCode: string;

  @Prop()
  paymentId: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
