import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true }) name: string;
  @Prop({ required: true, unique: true }) slug: string;
  @Prop() image?: string;
  @Prop({ type: Types.ObjectId, ref: 'Category', default: null }) parentId?: Types.ObjectId;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
