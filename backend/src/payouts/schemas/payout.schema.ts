import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PayoutStatus } from '../../common/enums';

export type PayoutDocument = Payout & Document;

@Schema({ timestamps: true })
export class Payout {
  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true }) vendorId: Types.ObjectId;
  @Prop({ required: true }) amount: number;
  @Prop({ type: String, enum: PayoutStatus, default: PayoutStatus.PENDING }) status: PayoutStatus;
  @Prop({ required: true }) periodStart: Date;
  @Prop({ required: true }) periodEnd: Date;
  @Prop() paidAt?: Date;
  @Prop() notes?: string;
}

export const PayoutSchema = SchemaFactory.createForClass(Payout);
