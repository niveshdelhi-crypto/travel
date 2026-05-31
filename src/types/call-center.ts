export type CustomerTier = "standard" | "recurring" | "vip" | "enterprise";

export type CallerContext = {
  is_existing_customer: boolean;
  phone_number: string;
  customer_name: string | null;
  lead_id: string | null;
  traveler_id: string | null;
  lifetime_revenue: number;
  bookings_count: number;
  last_booking: {
    id: string;
    gross_revenue: number;
    currency: string;
    created_at: string;
    confirmation_reference: string | null;
  } | null;
  customer_tier: CustomerTier;
  recent_leads: Array<{
    id: string;
    status: string;
    created_at: string;
    pickup_location: string;
    drop_location: string;
  }>;
};

export type CallCenterMetrics = {
  todays_calls: number;
  inbound_calls_today: number;
  connected_calls: number;
  missed_calls: number;
  average_duration_seconds: number;
  bookings_created: number;
  revenue_generated: number;
  as_of: string;
};

export type CallDispositionType =
  | "ANSWERED"
  | "BUSY"
  | "NO_ANSWER"
  | "VOICEMAIL"
  | "CALLBACK_REQUESTED";

export type IncomingCallPayload = {
  id: string;
  status: string;
  direction: string;
  agent_id: string | null;
  lead_id: string | null;
  provider_call_id: string | null;
  provider?: string;
  from_number?: string;
  to_number?: string;
  started_at?: string | null;
  caller?: CallerContext;
  _realtime?: { eventId?: string; emittedAt?: string };
};
