// ============================================================
// FleetNexus — Domain Service Layer
// All API calls are organised by domain. Each service uses
// the shared apiClient and returns typed responses.
// ============================================================

import { apiClient } from "./api-client";
import type {
  User,
  Lead,
  LeadStage,
  Call,
  Provider,
  Transaction,
  Notification,
  Agent,
  VehicleListing,
  SearchFilters,
  ApiResponse,
  PaginatedResponse,
} from "@/types";
import type {
  MarketplaceCountryDetail,
  MarketplaceCountrySummary,
  MarketplaceDestinationDetail,
  MarketplaceSupplier,
  MarketplaceTestimonial,
  MarketplaceTrustSnapshot,
} from "@/types/marketplace";

export type PublicLeadInput = {
  pickup_location: string;
  drop_location: string;
  pickup_datetime: string;
  return_datetime: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
};

export type PublicLeadResponse = {
  success: true;
  message: string;
  leadId: string;
  status: string;
};

export type BackendUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "sales_agent";
  is_active: boolean;
  created_at: string;
};

export type BackendLeadStatus = "NEW" | "CONTACTED" | "NEGOTIATING" | "CONFIRMED" | "COMPLETED";

export type BackendLead = {
  id: string;
  pickup_location: string;
  drop_location: string;
  pickup_datetime: string;
  return_datetime: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: BackendLeadStatus;
  assigned_to: string | null;
  booking_value: string | number | null;
  last_contacted_at: string | null;
  follow_up_at?: string | null;
  created_at: string;
  updated_at: string;
  assigned_agent?: {
    id: string;
    name: string;
    email: string;
    current_lead_count: number;
  } | null;
  notes?: Array<{
    id: string;
    body: string;
    created_at: string;
    author?: { id: string; name: string; email: string };
  }>;
};

export type BackendBookingListRow = {
  id: string;
  lead_id: string;
  gross_revenue: string;
  currency: string;
  partner_name: string | null;
  confirmation_reference: string | null;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  lead: {
    id: string;
    customer_name: string;
    customer_email: string;
    pickup_location: string;
    drop_location: string;
    status: BackendLeadStatus;
    assigned_to: string | null;
  };
  recorder: { id: string; name: string; email: string } | null;
};

export type BackendPaymentListRow = {
  id: string;
  booking_id: string;
  amount: string;
  currency: string;
  kind: string;
  memo: string | null;
  recorded_by: string | null;
  created_at: string;
  booking: {
    id: string;
    gross_revenue: string;
    partner_name: string | null;
    confirmation_reference: string | null;
    lead: {
      customer_name: string;
      pickup_location: string;
    };
  };
  recorder: { id: string; name: string; email: string } | null;
};

export type CloseLeadBookingPayload = {
  lead_id: string;
  gross_revenue: number;
  currency?: string;
  partner_name?: string;
  confirmation_reference?: string;
  notes?: string;
};

export type BackendPaginatedResponse<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type BackendCloseLeadBookingResponse = {
  booking: BackendBookingListRow;
  updatedLead: Pick<
    BackendLead,
    | "id"
    | "status"
    | "assigned_to"
    | "booking_value"
    | "customer_name"
    | "pickup_location"
    | "drop_location"
  >;
};

export type LeadMetrics = {
  statusCounts: Record<BackendLeadStatus, number>;
  totalLeads: number;
  activeAgents: Array<{ id: string; name: string; email: string; current_lead_count: number }>;
  revenue: number;
  conversion: number;
  bookings: number;
  activeCalls: number;
};

export function toUser(user: BackendUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    initials: user.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || user.email.slice(0, 2).toUpperCase(),
    status: "available",
    isActive: user.is_active,
    createdAt: user.created_at,
  };
}

// ─── Lead Service ─────────────────────────────────────────────

export const leadsService = {
  async createPublic(
    payload: PublicLeadInput,
    idempotencyKey: string,
    config?: { timeout?: number },
  ) {
    const response = (await apiClient.post<PublicLeadResponse>("/leads/public", payload, {
      skipAuth: true,
      debugLabel: "public-lead-submit",
      timeout: config?.timeout,
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    })) as unknown;

    if (isPublicLeadResponse(response)) return response;
    if (isWrappedPublicLeadResponse(response)) return response.data;

    throw new Error("Unexpected lead submission response from FleetNexus API.");
  },

  my(params?: { status?: BackendLeadStatus; page?: number; pageSize?: number }) {
    return apiClient.get<BackendPaginatedResponse<BackendLead>>("/leads/my", { params });
  },

  admin(params?: { status?: BackendLeadStatus; page?: number; pageSize?: number }) {
    return apiClient.get<BackendPaginatedResponse<BackendLead>>("/leads/admin", { params });
  },

  getOne(id: string) {
    return apiClient.get<BackendLead>(`/leads/${id}`);
  },

  metrics() {
    return apiClient.get<LeadMetrics>("/leads/metrics");
  },

  updateStatus(id: string, status: BackendLeadStatus) {
    return apiClient.patch<BackendLead>(`/leads/${id}/status`, { status });
  },

  patchLead(
    id: string,
    body: { status?: BackendLeadStatus; follow_up_at?: string | null; booking_value?: number },
  ) {
    return apiClient.patch<BackendLead>(`/leads/${id}`, body);
  },

  deleteLead(id: string) {
    return apiClient.delete(`/leads/${id}`);
  },

  list(params?: { stage?: LeadStage; agentId?: string; page?: number; limit?: number }) {
    return apiClient.get<PaginatedResponse<Lead>>("/leads", { params });
  },

  get(id: string) {
    return apiClient.get<ApiResponse<Lead>>(`/leads/${id}`);
  },

  create(payload: Partial<Lead>) {
    return apiClient.post<ApiResponse<Lead>>("/leads", payload);
  },

  update(id: string, payload: Partial<Lead>) {
    return apiClient.patch<ApiResponse<Lead>>(`/leads/${id}`, payload);
  },

  updateStage(id: string, stage: LeadStage) {
    return apiClient.patch<ApiResponse<Lead>>(`/leads/${id}/stage`, { stage });
  },

  assign(id: string, agentId: string) {
    return apiClient.patch<ApiResponse<Lead>>(`/leads/${id}/assign`, { agentId });
  },

  addNote(id: string, note: string) {
    return apiClient.post<ApiResponse<Lead>>(`/leads/${id}/notes`, { content: note });
  },

  getTimeline(id: string) {
    return apiClient.get<PaginatedResponse<unknown>>(`/leads/${id}/timeline`);
  },
};

// ─── Public marketplace / SEO catalog ────────────────────────

export const marketplaceService = {
  trustSnapshot() {
    return apiClient.get<MarketplaceTrustSnapshot>("/marketplace/trust-snapshot", {
      skipAuth: true,
    });
  },

  suppliers() {
    return apiClient.get<MarketplaceSupplier[]>("/marketplace/suppliers", { skipAuth: true });
  },

  testimonials() {
    return apiClient.get<MarketplaceTestimonial[]>("/marketplace/testimonials", { skipAuth: true });
  },

  countries() {
    return apiClient.get<MarketplaceCountrySummary[]>("/marketplace/countries", { skipAuth: true });
  },

  country(slug: string) {
    return apiClient.get<MarketplaceCountryDetail>(`/marketplace/countries/${slug}`, {
      skipAuth: true,
    });
  },

  trendingDestinations(limit?: number) {
    return apiClient.get<
      Array<MarketplaceDestinationDetail & { country: { slug: string; name: string; iso_code: string } }>
    >("/marketplace/destinations/trending", {
      skipAuth: true,
      params: limit !== undefined ? { limit } : undefined,
    });
  },

  destinationCity(slug: string) {
    return apiClient.get<MarketplaceDestinationDetail>(
      `/marketplace/destinations/city/${encodeURIComponent(slug)}`,
      { skipAuth: true },
    );
  },

  destinationAirport(slug: string) {
    return apiClient.get<MarketplaceDestinationDetail>(
      `/marketplace/destinations/airport/${encodeURIComponent(slug)}`,
      { skipAuth: true },
    );
  },
};

export const marketplaceAdminService = {
  createSupplier(payload: {
    name: string;
    slug?: string;
    website_url?: string;
    logo_url?: string;
    sort_order?: number;
  }) {
    return apiClient.post<MarketplaceSupplier>("/marketplace/admin/suppliers", payload);
  },

  updateSupplier(
    id: string,
    payload: Partial<{
      name: string;
      slug: string;
      website_url: string | null;
      logo_url: string | null;
      sort_order: number;
    }>,
  ) {
    return apiClient.patch<MarketplaceSupplier>(`/marketplace/admin/suppliers/${id}`, payload);
  },

  deleteSupplier(id: string) {
    return apiClient.delete<{ ok: boolean }>(`/marketplace/admin/suppliers/${id}`);
  },
};

// ─── Booking ledger (persisted corridor wins) ──────────────────

export const bookingsService = {
  list(params?: { page?: number; pageSize?: number }) {
    return apiClient.get<BackendPaginatedResponse<BackendBookingListRow>>("/bookings", { params });
  },

  closeLead(payload: CloseLeadBookingPayload) {
    return apiClient.post<BackendCloseLeadBookingResponse>("/bookings/close-lead", payload);
  },
};

// ─── Calls Service ────────────────────────────────────────────

export const callsService = {
  listActive() {
    return apiClient.get<ApiResponse<Call[]>>("/calls/active");
  },

  listHistory(params?: { page?: number; limit?: number }) {
    return apiClient.get<PaginatedResponse<Call>>("/calls/history", { params });
  },

  initiate(payload: { customerId: string; leadId?: string; phoneNumber: string }) {
    return apiClient.post<ApiResponse<Call>>("/calls/initiate", payload);
  },

  end(callId: string) {
    return apiClient.patch<ApiResponse<Call>>(`/calls/${callId}/end`);
  },

  mute(callId: string, muted: boolean) {
    return apiClient.patch<ApiResponse<void>>(`/calls/${callId}/mute`, { muted });
  },

  hold(callId: string, onHold: boolean) {
    return apiClient.patch<ApiResponse<void>>(`/calls/${callId}/hold`, { onHold });
  },

  transfer(callId: string, targetAgentId: string) {
    return apiClient.patch<ApiResponse<void>>(`/calls/${callId}/transfer`, { targetAgentId });
  },
};

// ─── Provider Service ─────────────────────────────────────────

export const providersService = {
  list(params?: { status?: string; tier?: string }) {
    return apiClient.get<PaginatedResponse<Provider>>("/providers", { params });
  },

  get(id: string) {
    return apiClient.get<ApiResponse<Provider>>(`/providers/${id}`);
  },

  update(id: string, payload: Partial<Provider>) {
    return apiClient.patch<ApiResponse<Provider>>(`/providers/${id}`, payload);
  },

  getInventory(id: string) {
    return apiClient.get<PaginatedResponse<VehicleListing>>(`/providers/${id}/inventory`);
  },
};

// ─── Payments Service ─────────────────────────────────────────

export const paymentsService = {
  listRecognized(params?: { page?: number; pageSize?: number }) {
    return apiClient.get<BackendPaginatedResponse<BackendPaymentListRow>>("/payments", { params });
  },

  listTransactions(params?: { status?: string; page?: number; limit?: number }) {
    return apiClient.get<PaginatedResponse<Transaction>>("/payments/transactions", { params });
  },

  initiateRefund(transactionId: string, amount?: number) {
    return apiClient.post<ApiResponse<Transaction>>(`/payments/${transactionId}/refund`, { amount });
  },

  createPaymentIntent(bookingId: string) {
    return apiClient.post<ApiResponse<{ clientSecret: string }>>("/payments/intent", { bookingId });
  },
};

// ─── Team / Agent Service ─────────────────────────────────────

export const teamService = {
  list() {
    return apiClient.get<ApiResponse<Agent[]>>("/team");
  },

  get(id: string) {
    return apiClient.get<ApiResponse<Agent>>(`/team/${id}`);
  },

  updateStatus(id: string, status: Agent["status"]) {
    return apiClient.patch<ApiResponse<Agent>>(`/team/${id}/status`, { status });
  },

  invite(email: string, role: string) {
    return apiClient.post<ApiResponse<Agent>>("/team/invite", { email, role });
  },
};

// ─── Analytics Service ────────────────────────────────────────

export const analyticsService = {
  getDashboardMetrics() {
    return apiClient.get<ApiResponse<Record<string, number>>>("/analytics/dashboard");
  },

  getRevenueChart(range: "7d" | "30d" | "90d" | "1y") {
    return apiClient.get<ApiResponse<Array<{ label: string; revenue: number; bookings: number }>>>(
      "/analytics/revenue",
      { params: { range } },
    );
  },

  getConversionFunnel() {
    return apiClient.get<ApiResponse<Array<{ stage: string; count: number; percentage: number }>>>(
      "/analytics/funnel",
    );
  },

  getProviderPerformance() {
    return apiClient.get<ApiResponse<Array<{ name: string; fillRate: number; score: number }>>>(
      "/analytics/providers",
    );
  },
};

// ─── Notifications Service ────────────────────────────────────

export const notificationsService = {
  list() {
    return apiClient.get<PaginatedResponse<Notification>>("/notifications");
  },

  markRead(id: string) {
    return apiClient.patch<ApiResponse<void>>(`/notifications/${id}/read`);
  },

  markAllRead() {
    return apiClient.patch<ApiResponse<void>>("/notifications/read-all");
  },
};

// ─── Search / Marketplace Service ─────────────────────────────

export const searchService = {
  searchVehicles(filters: SearchFilters) {
    return apiClient.post<PaginatedResponse<VehicleListing>>("/search/vehicles", filters);
  },

  getVehicle(id: string) {
    return apiClient.get<ApiResponse<VehicleListing>>(`/vehicles/${id}`);
  },
};

// ─── Auth Service ─────────────────────────────────────────────

export const authService = {
  async signIn(email: string, password: string) {
    const response = await apiClient.post<{ user: BackendUser }>(
      "/auth/login",
      { email, password },
      { skipAuth: true },
    );
    return toUser(response.user);
  },

  signOut() {
    return apiClient.post<{ success: true }>("/auth/logout");
  },

  async me() {
    const response = await apiClient.get<BackendUser>("/auth/me");
    return toUser(response);
  },
};

function isPublicLeadResponse(value: unknown): value is PublicLeadResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Record<string, unknown>).success === true &&
    typeof (value as Record<string, unknown>).leadId === "string"
  );
}

function isWrappedPublicLeadResponse(value: unknown): value is { data: PublicLeadResponse } {
  return (
    typeof value === "object" &&
    value !== null &&
    isPublicLeadResponse((value as Record<string, unknown>).data)
  );
}
