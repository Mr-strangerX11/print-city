import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AuditAction } from '../enums';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'User', default: null }) userId?: Types.ObjectId;
  @Prop({ type: String, enum: AuditAction, required: true }) action: AuditAction;
  @Prop({ required: true }) entity: string;
  @Prop() entityId?: string;
  @Prop({ type: Object }) oldValue?: any;
  @Prop({ type: Object }) newValue?: any;
  @Prop() ipAddress?: string;
  @Prop() userAgent?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
