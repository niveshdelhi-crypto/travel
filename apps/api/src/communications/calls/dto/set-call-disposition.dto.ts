import { CallDispositionType } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class SetCallDispositionDto {
  @IsEnum(CallDispositionType)
  disposition!: CallDispositionType;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
