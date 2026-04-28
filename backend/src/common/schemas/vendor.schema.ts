import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum VendorStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED',
}

@Schema({ timestamps: true })
export class Vendor extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, unique: true })
  storeSlug: string;

  @Prop({ required: true })
  storeName: string;

  @Prop()
  description: string;

  @Prop()
  logo: string;

  @Prop({ type: String, enum: VendorStatus, default: VendorStatus.PENDING })
  status: VendorStatus;

  @Prop({ default: 10 })
  commissionRate: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);
