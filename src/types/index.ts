// ============================================================
// Book my Carz — Core Platform Types
// Shared across CRM, Marketplace, Admin, and API layers
// ============================================================

// ─── Auth & RBAC ────────────────────────────────────────────

export type UserRole = "admin" | "finance_admin" | "operations_manager" | "sales_agent";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  initials: string;
  status: AgentStatus;
  teamId?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ─── Agent & Team ────────────────────────────────────────────

export type AgentStatus = "available" | "on_call" | "wrap_up" | "break" | "offline";

export interface Agent {
  id: string;
  name: string;
  initials: string;
  role: string;
  status: AgentStatus;
  callsToday: number;
  conversionRate: number;
  avgHandleTime: string;
  qualityScore: number;
  lastActive: string;
  email: string;
  phoneExtension?: string;
}

// ─── Lead & Pipeline ─────────────────────────────────────────

export type LeadStage =
  | "new"
  | "assigned"
  | "contacted"
  | "negotiating"
  | "confirmed"
  | "completed";

export type UrgencyLevel = "high" | "med" | "low";
export type PaymentStatus = "paid" | "pending" | "unpaid";
export type LeadTone = "blue" | "violet" | "amber" | "emerald" | "rose";

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  trip: string;
  pickup: string;
  dropoff: string;
  dates: string;
  pickupDate: string;
  returnDate: string;
  budget: string;
  vehicleClass?: string;
  urgency: UrgencyLevel;
  payment: PaymentStatus;
  agent: string;
  agentId?: string;
  score: number;
  stage: LeadStage;
  tone: LeadTone;
  source?: string;
  lifetimeValue?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string[];
  aiSummary?: string;
}

export interface LeadTimelineEvent {
  id: string;
  type: "call" | "email" | "note" | "stage_change" | "ai" | "payment" | "booking";
  title: string;
  body?: string;
  time: string;
  agentId?: string;
  tags?: Array<{ label: string; tone: BadgeTone }>;
}

// ─── Bookings ─────────────────────────────────────────────────

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "active"
  | "completed"
  | "cancelled"
  | "refunded";

export interface Booking {
  id: string;
  leadId?: string;
  customerId: string;
  customerName: string;
  vehicle: string;
  vehicleClass: string;
  provider: string;
  providerId: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  returnDate: string;
  totalAmount: string;
  status: BookingStatus;
  agentId: string;
  createdAt: string;
  confirmedAt?: string;
}

// ─── Calls & Telephony ────────────────────────────────────────

export type CallDirection = "inbound" | "outbound";
export type CallStatus = "live" | "hold" | "ringing" | "wrap_up" | "completed" | "missed";

export interface Call {
  id: string;
  agentId: string;
  agentName: string;
  customerName: string;
  customerPhone: string;
  direction: CallDirection;
  status: CallStatus;
  duration: string;
  recordingUrl?: string;
  leadId?: string;
  startedAt: string;
  endedAt?: string;
}

export interface ActiveCall extends Call {
  isMuted: boolean;
  isOnHold: boolean;
  isRecording: boolean;
}

// ─── Providers ─────────────────────────────────────────────────

export type ProviderTier = "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C";
export type ProviderStatus = "active" | "degraded" | "suspended";

export interface Provider {
  id: string;
  name: string;
  tier: ProviderTier;
  vehicleCount: number;
  fillRate: string;
  fillRateValue: number;
  rating: number;
  status: ProviderStatus;
  locations: number;
  monthlyRevenue?: string;
  slaScore?: number;
  contactName?: string;
  contactEmail?: string;
}

// ─── Payments ──────────────────────────────────────────────────

export type TransactionStatus = "succeeded" | "pending" | "refunded" | "failed";
export type PaymentMethod = "card" | "apple_pay" | "google_pay" | "bank_transfer";

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  provider: string;
  paymentMethod: string;
  amount: string;
  rawAmount: number;
  status: TransactionStatus;
  date: string;
  bookingId?: string;
  refundedAt?: string;
}

// ─── Analytics ────────────────────────────────────────────────

export interface MetricPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface ConversionFunnelStep {
  stage: string;
  count: number;
  percentage: number;
}

// ─── Notifications ────────────────────────────────────────────

export type NotificationType =
  | "booking"
  | "payment"
  | "lead"
  | "call"
  | "system"
  | "provider_alert";
export type NotificationPriority = "urgent" | "normal" | "low";

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  time: string;
  read: boolean;
  actionUrl?: string;
}

// ─── UI Primitives ────────────────────────────────────────────

export type BadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "primary";

export type TrendDirection = "up" | "down" | "flat";

// ─── API Layer ────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, string>;
}

// ─── Search & Marketplace ─────────────────────────────────────

export interface VehicleListing {
  id: string;
  name: string;
  category: "suv" | "sedan" | "sports" | "electric" | "van" | "luxury";
  provider: string;
  providerId: string;
  imageUrl: string;
  pricePerDay: number;
  seats: number;
  transmission: "auto" | "manual";
  fuel: "petrol" | "diesel" | "hybrid" | "electric";
  rating: number;
  reviewCount: number;
  tags: string[];
  features?: string[];
  available: boolean;
  pickupLocation: string;
}

export interface SearchFilters {
  pickupLocation?: string;
  dropoffLocation?: string;
  pickupDate?: string;
  returnDate?: string;
  vehicleCategory?: string[];
  transmission?: string[];
  fuel?: string[];
  providers?: string[];
  maxPricePerDay?: number;
  minSeats?: number;
}

// ─── Socket Events ────────────────────────────────────────────

export type CallRealtimePayload = {
  id: string;
  status: string;
  direction: string;
  agent_id: string | null;
  lead_id: string | null;
  provider_call_id: string | null;
  failure_reason?: string | null;
  _realtime?: { eventId?: string; emittedAt?: string };
};

export interface SocketEvents {
  "lead.created": unknown;
  "lead.assigned": unknown;
  "lead.updated": unknown;
  "lead.deleted": { id?: string };
  "lead.note.created": unknown;
  "metrics.changed": unknown;
  "notification.created": { type?: string; leadId?: string; message?: string };
  "call.started": { call: ActiveCall };
  "call.ended": { callId: string };
  "call.status_changed": { callId: string; status: CallStatus };
  CALL_CREATED: CallRealtimePayload;
  CALL_RINGING: CallRealtimePayload;
  CALL_ANSWERED: CallRealtimePayload;
  CALL_COMPLETED: CallRealtimePayload;
  CALL_FAILED: CallRealtimePayload;
  PAYMENT_CREATED: import("@/types/payments-orchestration").PaymentRealtimePayload;
  PAYMENT_SUCCESS: import("@/types/payments-orchestration").PaymentRealtimePayload;
  PAYMENT_FAILED: import("@/types/payments-orchestration").PaymentRealtimePayload;
  BOOKING_CONFIRMED: import("@/types/payments-orchestration").BookingConfirmedPayload;
  BOOKING_CREATED: import("@/types/payments-orchestration").BookingConfirmedPayload;
  BOOKING_FAILED: import("@/types/payments-orchestration").BookingConfirmedPayload;
  INVOICE_GENERATED: { id: string; booking_id: string; invoice_number?: string; pdf_url?: string | null };
  VOUCHER_GENERATED: { id: string; booking_id: string; voucher_number?: string; pdf_url?: string | null };
  REFUND_CREATED: { id: string; booking_id: string; status: string; amount?: number };
  REFUND_COMPLETED: { id: string; booking_id: string; status: string };
}
