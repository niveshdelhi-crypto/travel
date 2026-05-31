import { IsString, MaxLength } from "class-validator";

export class UpdateFinanceNotesDto {
  @IsString()
  @MaxLength(4000)
  finance_notes!: string;
}
