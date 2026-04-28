import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum ProductStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  basePrice: number;

  @Prop({ type: String, enum: ProductStatus, default: ProductStatus.PENDING_APPROVAL })
  status: ProductStatus;

  @Prop()
  vendorId: string;

  @Prop()
  categoryId: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [], default: [] })
  images: Array<{ url: string; isPrimary: boolean }>;

  @Prop({ type: [], default: [] })
  variants: Array<{ price: number; color: string; size: string }>;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
