import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from "class-validator";

export class CloseLeadBookingDto {
  @IsUUID()
  lead_id!: string;

  /** Gross corridor revenue recognized on close */
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  gross_revenue!: number;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  partner_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  confirmation_reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
