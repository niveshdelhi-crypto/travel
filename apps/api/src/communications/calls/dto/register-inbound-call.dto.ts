import { IsOptional, IsPhoneNumber, IsUUID } from "class-validator";
import { IsVonageCallUuid } from "../../vonage/validators/is-vonage-call-uuid.decorator";

export class RegisterInboundCallDto {
  @IsPhoneNumber()
  from_number!: string;

  @IsPhoneNumber()
  to_number!: string;

  @IsOptional()
  @IsVonageCallUuid()
  provider_call_id?: string;

  @IsOptional()
  @IsUUID()
  lead_id?: string;
}
