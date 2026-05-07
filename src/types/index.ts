// ============================================================
// FleetNexus — Core Platform Types
// Shared across CRM, Marketplace, Admin, and API layers
// ============================================================

// ─── Auth & RBAC ────────────────────────────────────────────

export type UserRole = "admin" | "sales_manager" | "sales_agent" | "support";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  initials: string;
  status: AgentStatus;
  teamId?: string;
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

export interface SocketEvents {
  "lead:updated": { leadId: string; changes: Partial<Lead> };
  "call:started": { call: ActiveCall };
  "call:ended": { callId: string };
  "call:status_changed": { callId: string; status: CallStatus };
  "notification:new": { notification: Notification };
  "agent:status_changed": { agentId: string; status: AgentStatus };
  "metric:updated": { key: string; value: number };
}
