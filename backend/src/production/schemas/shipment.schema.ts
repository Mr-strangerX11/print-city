import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ShipmentStatus } from '../../common/enums';

export type ShipmentDocument = Shipment & Document;

@Schema({ timestamps: true })
export class Shipment {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, unique: true }) orderId: Types.ObjectId;
  @Prop() provider?: string;
  @Prop() trackingNumber?: string;
  @Prop() labelUrl?: string;
  @Prop({ type: String, enum: ShipmentStatus, default: ShipmentStatus.PENDING }) status: ShipmentStatus;
  @Prop({ default: null }) estimatedAt?: Date;
  @Prop({ default: null }) shippedAt?: Date;
  @Prop({ default: null }) deliveredAt?: Date;
  @Prop() notes?: string;
}

export const ShipmentSchema = SchemaFactory.createForClass(Shipment);
