import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { QCStatus } from '../../common/enums';

export type QualityCheckDocument = QualityCheck & Document;

@Schema({ timestamps: true })
export class QualityCheck {
  @Prop({ type: Types.ObjectId, ref: 'PrintJob', required: true, unique: true }) printJobId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', default: null }) inspectedBy?: Types.ObjectId;
  @Prop({ type: String, enum: QCStatus, default: QCStatus.PENDING }) status: QCStatus;
  @Prop() notes?: string;
  @Prop({ type: [String], default: [] }) images: string[];
  @Prop({ default: null }) checkedAt?: Date;
}

export const QualityCheckSchema = SchemaFactory.createForClass(QualityCheck);
