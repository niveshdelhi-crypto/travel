import { IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class CreateOutboundCallDto {
  @IsString()
  @MinLength(8)
  to_number!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  from_number?: string;

  @IsOptional()
  @IsUUID()
  lead_id?: string;
}
