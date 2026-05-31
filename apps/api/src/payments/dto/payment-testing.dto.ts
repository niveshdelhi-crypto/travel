import { Type } from "class-transformer";
import { IsIn, IsOptional, IsString, IsUUID, MaxLength, Min } from "class-validator";

export class PaymentTestingEnvironmentQueryDto {
  @IsOptional()
  @IsIn(["sandbox", "live"])
  environment?: "sandbox" | "live";
}

export class PaymentTestingAttemptActionDto {
  @IsOptional()
  @IsUUID()
  attempt_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  order_id?: string;

  @IsOptional()
  @IsUUID()
  session_id?: string;

  @IsOptional()
  @IsUUID()
  transaction_id?: string;
}

export class PaymentTestingRefundDto extends PaymentTestingAttemptActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  capture_id?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
