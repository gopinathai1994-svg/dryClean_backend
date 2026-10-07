import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsString()
  icon!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
