import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { InvoiceStatus } from '../../common/enums';

export type InvoiceDocument = Invoice & Document;

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ required: true, unique: true }) invoiceNumber: string;
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, unique: true }) orderId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ type: String, enum: InvoiceStatus, default: InvoiceStatus.ISSUED }) status: InvoiceStatus;
  @Prop({ required: true }) subtotal: number;
  @Prop({ default: 0 }) discount: number;
  @Prop({ default: 0 }) shipping: number;
  @Prop({ default: 0 }) tax: number;
  @Prop({ required: true }) total: number;
  @Prop({ default: 0 }) totalVendorEarnings: number;
  @Prop({ default: 0 }) totalAdminEarnings: number;
  @Prop() notes?: string;
  @Prop({ default: Date.now }) issuedAt: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
