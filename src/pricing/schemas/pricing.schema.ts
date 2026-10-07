import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PricingDocument = HydratedDocument<Pricing>;

@Schema({ timestamps: true })
export class Pricing {
  @Prop({ required: true, trim: true })
  item!: string;

  @Prop({ required: true, trim: true })
  serviceType!: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ default: true })
  active!: boolean;
}

export const PricingSchema = SchemaFactory.createForClass(Pricing);
