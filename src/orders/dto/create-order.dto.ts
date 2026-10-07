import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';
import { OrderStatus } from '../order-status.enum';

export class CreateOrderDto {
  @IsString()
  customerName!: string;

  @Matches(/^\+?[0-9\s-]{10,15}$/)
  mobile!: string;

  @IsString()
  address!: string;

  @IsString()
  serviceType!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  clothCount!: number;

  @IsDateString()
  pickupDate!: string;

  @IsString()
  pickupTime!: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalAmount!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
