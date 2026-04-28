import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CustomOrderStatus } from '../../common/enums';

export type CustomDesignOrderDocument = CustomDesignOrder & Document;

@Schema({ timestamps: true })
export class CustomDesignOrder {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ required: true }) productType: string;
  @Prop({ required: true }) designUrl: string;
  @Prop() publicId?: string;
  @Prop() notes?: string;
  @Prop() adminNotes?: string;
  @Prop({ type: String, enum: CustomOrderStatus, default: CustomOrderStatus.PENDING }) status: CustomOrderStatus;
  @Prop() price?: number;
  @Prop() size?: string;
  @Prop() color?: string;
  @Prop({ default: 1 }) qty: number;
}

export const CustomDesignOrderSchema = SchemaFactory.createForClass(CustomDesignOrder);
