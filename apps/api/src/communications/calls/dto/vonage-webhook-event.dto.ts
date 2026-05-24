import { IsOptional, IsString } from "class-validator";
import { IsVonageCallUuid } from "../../vonage/validators/is-vonage-call-uuid.decorator";

export class VonageWebhookEventDto {
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
  status?: string;

  @IsOptional()
  @IsString()
  direction?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  rate?: string;

  @IsOptional()
  @IsString()
  price?: string;

  @IsOptional()
  @IsString()
  timestamp?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
