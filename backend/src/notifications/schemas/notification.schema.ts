import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ required: true }) type: string;
  @Prop({ required: true }) title: string;
  @Prop() message?: string;
  @Prop({ type: Object }) data?: any;
  @Prop({ default: null }) readAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
