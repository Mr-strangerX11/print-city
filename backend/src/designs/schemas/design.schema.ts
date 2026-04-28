import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DesignStatus } from '../../common/enums';

export type DesignDocument = Design & Document;

@Schema({ timestamps: true })
export class Design {
  @Prop({ required: true }) title: string;
  @Prop() description?: string;
  @Prop({ type: [String], default: [] }) tags: string[];
  @Prop({ required: true }) storageKey: string;
  @Prop({ default: 'cloudinary' }) storageType: string;
  @Prop({ required: true }) fileType: string;
  @Prop({ required: true }) fileSize: number;
  @Prop() width?: number;
  @Prop() height?: number;
  @Prop() dpi?: number;
  @Prop({ type: String, enum: DesignStatus, default: DesignStatus.PENDING }) status: DesignStatus;
  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true }) vendorId: Types.ObjectId;
}

export const DesignSchema = SchemaFactory.createForClass(Design);
