import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ViewTokenDocument = ViewToken & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class ViewToken {
  @Prop({ required: true, unique: true }) token: string;
  @Prop({ type: Types.ObjectId, ref: 'Design', required: true }) designId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ required: true }) userRole: string;
  @Prop({ required: true }) expiresAt: Date;
  @Prop({ default: null }) usedAt?: Date;
  @Prop() ipAddress?: string;
  @Prop() userAgent?: string;
}

export const ViewTokenSchema = SchemaFactory.createForClass(ViewToken);
