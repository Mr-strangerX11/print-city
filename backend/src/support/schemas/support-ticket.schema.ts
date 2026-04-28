import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TicketStatus, TicketPriority } from '../../common/enums';

export type SupportTicketDocument = SupportTicket & Document;

@Schema({ timestamps: true })
export class SupportTicket {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ required: true }) subject: string;
  @Prop({ default: 'GENERAL' }) category: string;
  @Prop({ type: String, enum: TicketPriority, default: TicketPriority.MEDIUM }) priority: TicketPriority;
  @Prop({ type: String, enum: TicketStatus, default: TicketStatus.OPEN }) status: TicketStatus;
  @Prop({ type: Types.ObjectId, ref: 'Order', default: null }) orderId?: Types.ObjectId;
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);
