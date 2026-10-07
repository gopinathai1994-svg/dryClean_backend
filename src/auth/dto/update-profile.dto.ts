import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateEmailDto {
  @IsEmail()
  email!: string;
}

export class UpdatePasswordDto {
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
