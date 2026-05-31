import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

export class QuickCreateLeadFromCallDto {
  @IsString()
  @MaxLength(120)
  customer_name!: string;

  @IsOptional()
  @IsEmail()
  customer_email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  pickup_location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  drop_location?: string;
}
