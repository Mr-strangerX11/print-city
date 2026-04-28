import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentStatus } from '../../common/enums';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, unique: true }) orderId: Types.ObjectId;
  @Prop({ required: true }) provider: string;
  @Prop({ required: true }) amount: number;
  @Prop({ default: 'NPR' }) currency: string;
  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.UNPAID }) status: PaymentStatus;
  @Prop() externalId?: string;
  @Prop() refundId?: string;
  @Prop({ type: Object }) metadata?: Record<string, any>;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
