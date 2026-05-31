import { IsOptional, IsString, MaxLength } from "class-validator";

export class FailPaymentSessionDto {
  @IsString()
  @MaxLength(2000)
  failure_reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  finance_notes?: string;
}
