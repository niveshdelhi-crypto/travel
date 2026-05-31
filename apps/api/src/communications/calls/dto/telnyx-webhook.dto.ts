import { IsObject, IsOptional, IsString } from "class-validator";

export class TelnyxWebhookDto {
  @IsOptional()
  @IsObject()
  data?: {
    event_type?: string;
    id?: string;
    occurred_at?: string;
    payload?: TelnyxCallPayload;
    record_type?: string;
  };

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}

export type TelnyxCallPayload = {
  call_control_id?: string;
  call_session_id?: string;
  call_leg_id?: string;
  connection_id?: string;
  from?: string;
  to?: string;
  direction?: string;
  state?: string;
  client_state?: string;
  hangup_cause?: string;
  hangup_source?: string;
  sip_hangup_cause?: string;
  start_time?: string;
  end_time?: string;
  recording_urls?: { mp3?: string; wav?: string };
  recording_id?: string;
  recording_url?: string;
  public_recording_urls?: { mp3?: string; wav?: string };
};
