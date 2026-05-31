import { IsOptional, IsString, MaxLength } from "class-validator";

export class RecordCheckoutFailureDto {
  @IsString()
  @MaxLength(2000)
  failure_reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  order_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  finance_notes?: string;
}
