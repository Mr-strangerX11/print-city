import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CouponType } from '../../common/enums';

export type CouponDocument = Coupon & Document;

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, unique: true }) code: string;
  @Prop() description?: string;
  @Prop({ type: String, enum: CouponType, default: CouponType.PERCENTAGE }) type: CouponType;
  @Prop({ required: true }) value: number;
  @Prop({ default: null }) minOrderAmount?: number;
  @Prop({ default: null }) maxDiscount?: number;
  @Prop({ default: null }) usageLimit?: number;
  @Prop({ default: 0 }) usageCount: number;
  @Prop({ default: 1 }) perUserLimit: number;
  @Prop({ default: true }) isActive: boolean;
  @Prop({ default: Date.now }) startsAt: Date;
  @Prop({ default: null }) expiresAt?: Date;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
