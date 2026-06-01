import { Type } from "class-transformer";
import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

/** Finance ad-hoc card collection — creates lead, booking, and PayPal checkout session. */
export class QuickCollectPaymentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  customer_name!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsEmail()
  @MaxLength(254)
  customer_email!: string;

  @IsString()
  @MinLength(7)
  @MaxLength(40)
  customer_phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;
}
