import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum DesignStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

@Schema({ timestamps: true })
export class Invoice extends Document {
  @Prop({ required: true, unique: true })
  invoiceNumber: string;

  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ default: 0 })
  totalAmount: number;

  @Prop({ type: String, enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Prop()
  pdfUrl: string;

  @Prop()
  issuedDate: Date;

  @Prop()
  dueDate: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

@Schema({ timestamps: true })
export class Design extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop()
  imageUrl: string;

  @Prop()
  designData: string;

  @Prop({ type: String, enum: DesignStatus, default: DesignStatus.DRAFT })
  status: DesignStatus;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const DesignSchema = SchemaFactory.createForClass(Design);

@Schema({ timestamps: true })
export class SupportTicket extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  subject: string;

  @Prop()
  description: string;

  @Prop({ type: String, enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Prop({ type: String, enum: TicketPriority, default: TicketPriority.MEDIUM })
  priority: TicketPriority;

  @Prop()
  orderId: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);

@Schema({ timestamps: true })
export class SupportMessage extends Document {
  @Prop({ required: true })
  ticketId: string;

  @Prop({ required: true })
  senderId: string;

  @Prop()
  message: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const SupportMessageSchema = SchemaFactory.createForClass(SupportMessage);
