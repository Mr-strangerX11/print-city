import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SupportMessageDocument = SupportMessage & Document;

@Schema({ timestamps: true })
export class SupportMessage {
  @Prop({ type: Types.ObjectId, ref: 'SupportTicket', required: true }) ticketId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) senderId: Types.ObjectId;
  @Prop({ required: true }) body: string;
  @Prop({ default: false }) isStaff: boolean;
  @Prop({ type: [String], default: [] }) attachments: string[];
}

export const SupportMessageSchema = SchemaFactory.createForClass(SupportMessage);
