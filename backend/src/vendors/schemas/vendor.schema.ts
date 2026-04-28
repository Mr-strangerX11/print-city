import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { VendorStatus } from '../../common/enums';

export type VendorDocument = Vendor & Document;

@Schema({ timestamps: true })
export class Vendor {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true }) userId: Types.ObjectId;
  @Prop({ required: true }) storeName: string;
  @Prop({ required: true, unique: true }) storeSlug: string;
  @Prop() description?: string;
  @Prop() logo?: string;
  @Prop() banner?: string;
  @Prop({ default: 0.10 }) commissionRate: number;
  @Prop({ type: String, enum: VendorStatus, default: VendorStatus.PENDING }) status: VendorStatus;
  @Prop({ default: 0 }) totalEarnings: number;
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);
