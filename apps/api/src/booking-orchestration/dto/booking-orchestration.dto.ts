import { Type } from "class-transformer";
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";

export class InitiateBookingDto {
  @IsUUID()
  lead_id!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  gross_revenue!: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  partner_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  confirmation_reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsUUID()
  supplier_id?: string;

  @IsOptional()
  @IsUUID()
  vehicle_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  idempotency_key?: string;
}

export class CreateRefundRequestDto {
  @IsUUID()
  booking_id!: string;

  @IsOptional()
  @IsUUID()
  transaction_id?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  idempotency_key?: string;
}

export class ConfirmSupplierBookingDto {
  @IsString()
  @MaxLength(120)
  confirmation_number!: string;
}

export class StoreVaultEntryDto {
  @IsUUID()
  traveler_id!: string;

  @IsString()
  @MaxLength(120)
  token_reference!: string;

  @IsString()
  @MaxLength(4)
  last4!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  card_brand?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exp_month?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exp_year?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  billing_name?: string;

  @IsOptional()
  encrypted_token_payload?: Record<string, string>;
}
