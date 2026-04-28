import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ProductStatus } from '../../common/enums';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true }) vendorId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Category', default: null }) categoryId?: Types.ObjectId;
  @Prop({ required: true }) title: string;
  @Prop({ required: true, unique: true }) slug: string;
  @Prop() description?: string;
  @Prop({ required: true }) basePrice: number;
  @Prop({ type: String, enum: ProductStatus, default: ProductStatus.DRAFT }) status: ProductStatus;
  @Prop({ type: [String], default: [] }) tags: string[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
