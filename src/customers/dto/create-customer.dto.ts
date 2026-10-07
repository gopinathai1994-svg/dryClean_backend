import { IsOptional, IsString, Matches } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  name!: string;

  @Matches(/^\+?[0-9\s-]{10,15}$/)
  mobile!: string;

  @IsString()
  address!: string;

  @IsOptional()
  totalOrders?: number;
}
