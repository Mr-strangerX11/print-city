import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum PrintJobStatus {
  PENDING = 'PENDING',
  STARTED = 'STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  QUALITY_CHECK = 'QUALITY_CHECK',
  READY_TO_SHIP = 'READY_TO_SHIP',
  SHIPPED = 'SHIPPED',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class Payout extends Document {
  @Prop({ required: true })
  vendorId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ type: String, enum: PayoutStatus, default: PayoutStatus.PENDING })
  status: PayoutStatus;

  @Prop()
  bankAccountId: string;

  @Prop()
  transactionId: string;

  @Prop()
  processedDate: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const PayoutSchema = SchemaFactory.createForClass(Payout);

@Schema({ timestamps: true })
export class PrintJob extends Document {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  productId: string;

  @Prop({ type: String, enum: PrintJobStatus, default: PrintJobStatus.PENDING })
  status: PrintJobStatus;

  @Prop()
  designId: string;

  @Prop()
  printProvider: string;

  @Prop()
  trackingNumber: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const PrintJobSchema = SchemaFactory.createForClass(PrintJob);

@Schema({ timestamps: true })
export class QualityCheck extends Document {
  @Prop({ required: true })
  printJobId: string;

  @Prop({ required: true })
  inspectorId: string;

  @Prop({ required: true })
  passed: boolean;

  @Prop()
  notes: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const QualityCheckSchema = SchemaFactory.createForClass(QualityCheck);

@Schema({ timestamps: true })
export class Shipment extends Document {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  trackingNumber: string;

  @Prop()
  carrier: string;

  @Prop({ default: 'PENDING' })
  status: string;

  @Prop()
  shippedDate: Date;

  @Prop()
  deliveredDate: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ShipmentSchema = SchemaFactory.createForClass(Shipment);

@Schema({ timestamps: true })
export class CustomDesignOrder extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop({ default: 'PENDING' })
  status: string;

  @Prop()
  budget: number;

  @Prop()
  designerId: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CustomDesignOrderSchema = SchemaFactory.createForClass(CustomDesignOrder);

@Schema({ timestamps: true })
export class DesignPrintJob extends Document {
  @Prop({ required: true })
  designId: string;

  @Prop({ required: true })
  printJobId: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const DesignPrintJobSchema = SchemaFactory.createForClass(DesignPrintJob);

@Schema({ timestamps: true })
export class OrderItem extends Document {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  productId: string;

  @Prop({ default: 1 })
  quantity: number;

  @Prop()
  price: number;

  @Prop()
  vendorId: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true })
export class InvoiceItem extends Document {
  @Prop({ required: true })
  invoiceId: string;

  @Prop({ required: true })
  productId: string;

  @Prop({ default: 1 })
  quantity: number;

  @Prop()
  unitPrice: number;

  @Prop()
  totalPrice: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const InvoiceItemSchema = SchemaFactory.createForClass(InvoiceItem);

@Schema({ timestamps: true })
export class CouponUsage extends Document {
  @Prop({ required: true })
  couponId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  orderId: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CouponUsageSchema = SchemaFactory.createForClass(CouponUsage);

@Schema({ timestamps: true })
export class ViewToken extends Document {
  @Prop({ required: true })
  designId: string;

  @Prop({ required: true, unique: true })
  token: string;

  @Prop()
  expiresAt: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ViewTokenSchema = SchemaFactory.createForClass(ViewToken);
