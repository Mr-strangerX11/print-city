import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InvoiceItemDocument = InvoiceItem & Document;

@Schema({ timestamps: true })
export class InvoiceItem {
  @Prop({ type: Types.ObjectId, ref: 'Invoice', required: true }) invoiceId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true }) productId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'ProductVariant', required: true }) variantId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true }) vendorId: Types.ObjectId;
  @Prop({ required: true }) productName: string;
  @Prop({ required: true }) variantLabel: string;
  @Prop({ required: true }) qty: number;
  @Prop({ required: true }) unitPrice: number;
  @Prop({ required: true }) total: number;
  @Prop({ required: true }) vendorEarning: number;
  @Prop({ required: true }) adminEarning: number;
  @Prop() productImageUrl?: string;
}

export const InvoiceItemSchema = SchemaFactory.createForClass(InvoiceItem);
