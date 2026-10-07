import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { OrderStatus } from '../order-status.enum';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, trim: true })
  customerName!: string;

  @Prop({ required: true, trim: true })
  mobile!: string;

  @Prop({ required: true, trim: true })
  address!: string;

  @Prop({ required: true, trim: true })
  serviceType!: string;

  @Prop({ required: true, min: 1 })
  clothCount!: number;

  @Prop({ required: true })
  pickupDate!: Date;

  @Prop({ required: true })
  pickupTime!: string;

  @Prop({ enum: OrderStatus, default: OrderStatus.RECEIVED })
  status!: OrderStatus;

  @Prop({ required: true, min: 0 })
  totalAmount!: number;

  @Prop({ trim: true })
  notes?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
