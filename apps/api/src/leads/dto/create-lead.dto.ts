import { IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  pickup_location!: string;

  @IsString()
  @IsNotEmpty()
  drop_location!: string;

  @IsDateString()
  pickup_datetime!: string;

  @IsDateString()
  return_datetime!: string;

  @IsString()
  @IsNotEmpty()
  customer_name!: string;

  @IsEmail()
  customer_email!: string;

  @IsString()
  @MinLength(7)
  customer_phone!: string;

  @IsOptional()
  @IsString()
  driver_age?: string;

  @IsOptional()
  @IsString()
  residency?: string;
}
