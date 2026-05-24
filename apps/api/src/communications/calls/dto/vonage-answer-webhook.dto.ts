import { IsOptional, IsString } from "class-validator";
import { IsVonageCallUuid } from "../../vonage/validators/is-vonage-call-uuid.decorator";

export class VonageAnswerWebhookDto {
  @IsOptional()
  @IsString()
  @IsVonageCallUuid()
  uuid?: string;

  @IsOptional()
  @IsString()
  @IsVonageCallUuid()
  conversation_uuid?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  direction?: string;

  @IsOptional()
  @IsString()
  @IsVonageCallUuid()
  call_id?: string;
}
