import { Type } from "class-transformer";
import { IsBoolean, IsObject, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdatePaymentGatewayDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsObject()
  credentials?: Record<string, string>;

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;
}
