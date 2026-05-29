import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { PaymentGatewayType } from "@prisma/client";

export class CreatePaymentGatewayDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEnum(PaymentGatewayType)
  type!: PaymentGatewayType;

  @IsObject()
  credentials!: Record<string, string>;

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;
}
