import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AddressDocument = Address & Document;

@Schema({ timestamps: true })
export class Address {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ default: 'Home' }) label: string;
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) phone: string;
  @Prop({ required: true }) address: string;
  @Prop({ required: true }) city: string;
  @Prop({ required: true }) state: string;
  @Prop() zip?: string;
  @Prop({ default: 'Nepal' }) country: string;
  @Prop({ default: false }) isDefault: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
