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
  | "PAYMENT_ROUTE_ACCESSED"
  | "PAYMENT_SESSION_CREATED"
  | "PAYMENT_SESSION_ASSIGNED"
  | "PAYMENT_SESSION_OPENED"
  | "PAYMENT_SESSION_PROCESSING"
  | "PAYMENT_SESSION_SUCCESS"
  | "PAYMENT_SESSION_FAILURE"
  | "PAYMENT_SESSION_CANCELLED";

export type PaymentSessionStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

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

export type PaymentSessionQueueItem = {
  id: string;
  customer_name: string;
  booking_id: string;
  lead_id?: string;
  amount: number;
  currency: string;
  agent_name: string;
  gateway_name: string;
  gateway_type: PaymentGatewayType;
  status: PaymentSessionStatus;
  created_at: string;
  expires_at: string;
  checkout_path?: string;
};

export type QuickCollectPaymentResponse = {
  session_id: string;
  /** Full session payload so checkout console can render without a second round-trip. */
  session?: PaymentSessionDetail;
  checkout_path: string;
  queue_item: PaymentSessionQueueItem;
  lead_id: string;
  booking_id: string;
  provider_order_id?: string | null;
  checkout?: CheckoutPublicConfig;
  /** Null when the client should call checkout/prepare (faster quick-collect). */
  prepare?: CheckoutPrepareResponse | null;
};

export type PaymentSessionMetrics = {
  pending_payments: number;
  processing: number;
  successful_today: number;
  failed_today: number;
  revenue_today: number;
  revenue_this_month: number;
};

export type PaymentSessionDetail = {
  id: string;
  lead_id: string;
  booking_id: string;
  amount: string | number;
  currency: string;
  gateway_id: string;
  requested_by_id: string;
  processed_by_id: string | null;
  status: PaymentSessionStatus;
  checkout_mode: string;
  provider_order_id: string | null;
  finance_notes: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
  lead: {
    id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    pickup_location: string;
    drop_location: string;
    pickup_datetime: string;
    return_datetime: string;
    assigned_to: string | null;
    is_recurring_customer: boolean;
    customer_lifetime_value: string | number | null;
    assigned_agent: { id: string; name: string; email: string } | null;
    traveler: {
      id: string;
      full_name: string;
      email: string;
      phone: string | null;
      is_recurring: boolean;
      booking_count: number;
      lifetime_value: string | number;
    } | null;
  };
  booking: {
    id: string;
    gross_revenue: string | number;
    currency: string;
    lifecycle_status: string;
    status: string;
    vehicle: { id: string; make: string; model: string; vehicle_class: string } | null;
  };
  gateway: { id: string; name: string; type: PaymentGatewayType; is_active: boolean };
  requested_by: { id: string; name: string; email: string; role: string };
  processed_by: { id: string; name: string; email: string; role: string } | null;
  attempts?: PaymentSessionAttemptRow[];
};

export type PaymentAttemptStatus =
  | "INITIATED"
  | "ORDER_CREATED"
  | "SUBMITTED"
  | "CAPTURED"
  | "FAILED"
  | "CANCELLED";

export type PaymentSessionAttemptRow = {
  id: string;
  payment_session_id: string;
  gateway_id: string;
  attempt_number: number;
  status: PaymentAttemptStatus;
  provider_order_id: string | null;
  provider_capture_id: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
  initiated_by: { id: string; name: string; email: string } | null;
  gateway: { id: string; name: string; type: PaymentGatewayType };
};

export type CheckoutPublicConfig = {
  gatewayType: PaymentGatewayType;
  checkoutMode: string;
  clientId?: string;
  environment?: "sandbox" | "live";
  currency: string;
  amount: number;
  publishableKey?: string;
  supported: boolean;
  message?: string;
};

export type CheckoutConfigResponse = {
  session: {
    id: string;
    status: PaymentSessionStatus;
    amount: number;
    currency: string;
    gateway_id: string;
    provider_order_id: string | null;
    checkout_mode: string;
    finance_notes: string | null;
  };
  checkout: CheckoutPublicConfig;
  gateway: { id: string; name: string; type: PaymentGatewayType };
};

export type CheckoutPrepareResponse = CheckoutConfigResponse & {
  order: {
    attempt_id: string;
    order_id: string;
    approve_url: string | null;
    attempt_number: number;
    status: PaymentAttemptStatus;
  } | null;
};

export type GatewayOperationalStatus = "CONNECTED" | "DEGRADED" | "FAILED";

export type PaymentGatewayHealthRow = {
  gateway_id: string;
  gateway_name: string;
  gateway_type: PaymentGatewayType;
  status: GatewayOperationalStatus;
  environment: string | null;
  oauth_valid: boolean;
  orders_api: boolean;
  capture_api: boolean;
  card_processing_eligible: boolean | null;
  currency_supported: boolean | null;
  currency_tested: string | null;
  last_successful_charge: string | null;
  last_failed_charge: string | null;
  is_active: boolean;
  checked_at: string;
  detail?: string;
};

/** Finance checkout console (includes 24h attempt metrics). */
export type GatewayHealthRow = PaymentGatewayHealthRow & {
  healthy: boolean;
  latency_ms: number;
  health_message: string | null;
  attempts_24h: number;
  captured_24h: number;
  failed_24h: number;
  success_rate_24h: number | null;
};

export type PaymentGatewayHealthResponse = {
  data: PaymentGatewayHealthRow[];
  checked_at: string;
};

export type CreateCheckoutOrderResponse = {
  attempt_id: string;
  order_id: string;
  approve_url?: string | null;
  attempt_number: number;
  status: PaymentAttemptStatus;
};

export type PaymentSessionRealtimePayload = {
  id: string;
  booking_id: string;
  lead_id: string;
  assigned_to?: string | null;
  status: PaymentSessionStatus;
  amount?: number;
  currency?: string;
  gateway_id?: string;
  gateway_name?: string;
  requested_by_id?: string;
  processed_by_id?: string | null;
  _realtime?: { eventId?: string; emittedAt?: string };
};
