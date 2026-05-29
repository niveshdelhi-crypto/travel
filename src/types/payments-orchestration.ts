// Payment orchestration types — aligned with NestJS payments module

export type OrchestrationPaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "REFUNDED";

export type PaymentGatewayType = "stripe" | "paypal" | "wise";

export type BookingOrchestrationStatus =
  | "DRAFT"
  | "PAYMENT_PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

export type AuditLogAction =
  | "PAYMENT_GATEWAY_CREATED"
  | "PAYMENT_GATEWAY_UPDATED"
  | "PAYMENT_GATEWAY_DEACTIVATED"
  | "PAYMENT_REQUEST_CREATED"
  | "PAYMENT_PROCESSING"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "PAYMENT_REFUNDED"
  | "BOOKING_CONFIRMED"
  | "PAYMENT_ROUTE_ACCESSED";

export type PaymentGatewayRow = {
  id: string;
  name: string;
  type: PaymentGatewayType;
  is_active: boolean;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type PaymentTransactionRow = {
  id: string;
  booking_id: string;
  gateway_id: string;
  payment_request_id: string | null;
  type: string;
  status: OrchestrationPaymentStatus;
  amount: string | number;
  currency: string;
  provider_reference: string | null;
  failure_reason: string | null;
  idempotency_key: string;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  booking: {
    id: string;
    lead_id: string;
    gross_revenue: string | number;
    currency: string;
    status: BookingOrchestrationStatus;
    lead: {
      customer_name: string;
      assigned_to: string | null;
    };
  };
  gateway: { id: string; name: string; type: PaymentGatewayType };
  payment_request: { id: string; idempotency_key: string } | null;
  creator: { id: string; name: string; email: string } | null;
};

export type BookingPaymentRequestRow = {
  id: string;
  booking_id: string;
  gateway_id: string;
  status: OrchestrationPaymentStatus;
  amount: string | number;
  currency: string;
  description: string | null;
  provider_checkout_url: string | null;
  provider_reference: string | null;
  idempotency_key: string;
  metadata: Record<string, unknown> | null;
  requested_by: string | null;
  expires_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  booking: {
    id: string;
    lead_id: string;
    gross_revenue: string | number;
    currency: string;
    status: BookingOrchestrationStatus;
    lead: {
      customer_name: string;
      assigned_to: string | null;
    };
  };
  gateway: { id: string; name: string; type: PaymentGatewayType; is_active: boolean };
  requester: { id: string; name: string; email: string } | null;
  transactions: Array<{ id: string; status: OrchestrationPaymentStatus; created_at: string }>;
};

export type AuditLogRow = {
  id: string;
  action: AuditLogAction;
  resource_type: string;
  resource_id: string | null;
  user_id: string | null;
  ip_address: string | null;
  request_method: string | null;
  request_path: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  user: { id: string; name: string; email: string; role: string } | null;
};

export type PaginatedOrchestration<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaymentRealtimePayload = {
  id: string;
  booking_id: string;
  lead_id?: string;
  assigned_to?: string | null;
  status: string;
  amount?: number;
  currency?: string;
  gateway_type?: string;
  failure_reason?: string;
  _realtime?: { eventId?: string; emittedAt?: string };
};

export type BookingConfirmedPayload = {
  id: string;
  lead_id: string;
  status: string;
  assigned_to?: string | null;
  _realtime?: { eventId?: string; emittedAt?: string };
};

export type PaymentConsoleFilters = {
  status: OrchestrationPaymentStatus | "ALL";
  gatewayId: string | "ALL";
  agentId: string | "ALL";
  recurringOnly: boolean;
};
