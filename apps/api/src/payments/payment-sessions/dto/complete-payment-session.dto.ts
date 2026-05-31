import { IsOptional, IsString, MaxLength } from "class-validator";

export class CompletePaymentSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(256)
  provider_reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  finance_notes?: string;
}
