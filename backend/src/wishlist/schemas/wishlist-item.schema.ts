import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WishlistItemDocument = WishlistItem & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class WishlistItem {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true }) productId: Types.ObjectId;
}

export const WishlistItemSchema = SchemaFactory.createForClass(WishlistItem);

WishlistItemSchema.index({ userId: 1, productId: 1 }, { unique: true });
