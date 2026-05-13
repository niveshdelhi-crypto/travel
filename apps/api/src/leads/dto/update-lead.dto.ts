import { LeadStatus } from "@prisma/client";
import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpdateLeadDto {
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  booking_value?: number;

  /** ISO 8601 datetime, or omit field; send explicit `null` in JSON to clear */
  @IsOptional()
  follow_up_at?: string | null;
}

export class UpdateLeadStatusDto {
  @IsEnum(LeadStatus)
  status!: LeadStatus;
}

export class CreateLeadNoteDto {
  @IsString()
  body!: string;
}
