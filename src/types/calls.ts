export type CallStatus =
  | "INITIATED"
  | "RINGING"
  | "ANSWERED"
  | "COMPLETED"
  | "FAILED"
  | "BUSY"
  | "NO_ANSWER"
  | "CANCELLED";

export type CallDirection = "INBOUND" | "OUTBOUND";

export type CallRecord = {
  id: string;
  provider: "VONAGE";
  provider_call_id: string | null;
  direction: CallDirection;
  status: CallStatus;
  from_number: string;
  to_number: string;
  agent_id: string | null;
  lead_id: string | null;
  started_at: string | null;
  answered_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type CallRealtimePayload = {
  id: string;
  status: CallStatus;
  direction: CallDirection;
  agent_id: string | null;
  lead_id: string | null;
  provider_call_id: string | null;
  failure_reason?: string | null;
  _realtime?: { eventId?: string; emittedAt?: string };
};

export type CallSocketEvent =
  | "CALL_CREATED"
  | "CALL_RINGING"
  | "CALL_ANSWERED"
  | "CALL_COMPLETED"
  | "CALL_FAILED";

export type AgentPresence = "available" | "busy" | "on_call" | "offline";

export type LiveCallSession = CallRecord & {
  isMuted: boolean;
  isOnHold: boolean;
  lastEventAt: string;
};
