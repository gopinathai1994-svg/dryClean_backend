import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CustomerDocument = HydratedDocument<Customer>;

@Schema({ timestamps: true })
export class Customer {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, trim: true })
  mobile!: string;

  @Prop({ required: true, trim: true })
  address!: string;

  @Prop({ default: 0 })
  totalOrders!: number;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
