import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PrintJobStatus } from '../../common/enums';

export type PrintJobDocument = PrintJob & Document;

@Schema({ timestamps: true })
export class PrintJob {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, unique: true }) orderId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', default: null }) assignedTo?: Types.ObjectId;
  @Prop({ type: String, enum: PrintJobStatus, default: PrintJobStatus.QUEUED }) status: PrintJobStatus;
  @Prop({ default: 0 }) priority: number;
  @Prop() notes?: string;
  @Prop() fileUrl?: string;
  @Prop({ default: null }) printedAt?: Date;
  @Prop({ default: null }) estimatedAt?: Date;
}

export const PrintJobSchema = SchemaFactory.createForClass(PrintJob);
