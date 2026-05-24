import { IsOptional, IsString } from "class-validator";
import { IsVonageCallUuid } from "../../vonage/validators/is-vonage-call-uuid.decorator";

export class VonageRecordingWebhookDto {
  @IsOptional()
  @IsString()
  recording_url?: string;

  @IsOptional()
  @IsString()
  @IsVonageCallUuid()
  recording_uuid?: string;

  @IsOptional()
  @IsString()
  @IsVonageCallUuid()
  conversation_uuid?: string;

  @IsOptional()
  @IsString()
  @IsVonageCallUuid()
  call_uuid?: string;

  @IsOptional()
  @IsString()
  @IsVonageCallUuid()
  uuid?: string;

  @IsOptional()
  @IsString()
  start_time?: string;

  @IsOptional()
  @IsString()
  end_time?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  format?: string;
}
