import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductImageDocument = ProductImage & Document;

@Schema({ timestamps: true })
export class ProductImage {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true }) productId: Types.ObjectId;
  @Prop({ required: true }) url: string;
  @Prop({ default: false }) isPrimary: boolean;
  @Prop() altText?: string;
  @Prop() publicId?: string;
}

export const ProductImageSchema = SchemaFactory.createForClass(ProductImage);
