import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ServiceItemDocument = HydratedDocument<ServiceItem>;

@Schema({ timestamps: true })
export class ServiceItem {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ required: true, trim: true })
  icon!: string;

  @Prop({ default: true })
  active!: boolean;
}

export const ServiceItemSchema = SchemaFactory.createForClass(ServiceItem);
