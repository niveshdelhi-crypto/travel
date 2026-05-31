import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from "class-validator";

export class CreatePaymentSessionDto {
  @IsUUID()
  booking_id!: string;

  @IsUUID()
  gateway_id!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  @MaxLength(3)
  currency!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  finance_notes?: string;
}
