import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DesignPrintFormat, DesignColorMode, DesignPrintStatus } from '../../common/enums';

export type DesignPrintJobDocument = DesignPrintJob & Document;

@Schema({ timestamps: true })
export class DesignPrintJob {
  @Prop({ type: Types.ObjectId, ref: 'Design', required: true }) designId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) adminId: Types.ObjectId;
  @Prop({ type: String, enum: DesignPrintFormat, required: true }) format: DesignPrintFormat;
  @Prop({ type: String, enum: DesignColorMode, default: DesignColorMode.RGB }) colorMode: DesignColorMode;
  @Prop({ default: 1 }) copies: number;
  @Prop({ default: 300 }) dpi: number;
  @Prop({ default: 3 }) bleed: number;
  @Prop() notes?: string;
  @Prop({ type: String, enum: DesignPrintStatus, default: DesignPrintStatus.QUEUED }) status: DesignPrintStatus;
  @Prop({ default: null }) startedAt?: Date;
  @Prop({ default: null }) completedAt?: Date;
  @Prop() error?: string;
  @Prop({ unique: true, sparse: true, default: null }) printToken?: string;
  @Prop({ default: null }) printTokenExpiresAt?: Date;
}

export const DesignPrintJobSchema = SchemaFactory.createForClass(DesignPrintJob);
