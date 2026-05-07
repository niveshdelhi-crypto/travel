// ============================================================
// FleetNexus — Domain Service Layer
// All API calls are organised by domain. Each service uses
// the shared apiClient and returns typed responses.
// ============================================================

import { apiClient } from "./api-client";
import type {
  Lead,
  LeadStage,
  Booking,
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

// ─── Lead Service ─────────────────────────────────────────────

export const leadsService = {
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

// ─── Booking Service ──────────────────────────────────────────

export const bookingsService = {
  list(params?: { status?: string; page?: number; limit?: number }) {
    return apiClient.get<PaginatedResponse<Booking>>("/bookings", { params });
  },

  get(id: string) {
    return apiClient.get<ApiResponse<Booking>>(`/bookings/${id}`);
  },

  create(payload: Partial<Booking>) {
    return apiClient.post<ApiResponse<Booking>>("/bookings", payload);
  },

  confirm(id: string) {
    return apiClient.patch<ApiResponse<Booking>>(`/bookings/${id}/confirm`);
  },

  cancel(id: string, reason?: string) {
    return apiClient.patch<ApiResponse<Booking>>(`/bookings/${id}/cancel`, { reason });
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
  signIn(email: string, password: string) {
    return apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string; user: unknown }>>(
      "/auth/signin",
      { email, password },
      { skipAuth: true },
    );
  },

  signOut() {
    return apiClient.post<ApiResponse<void>>("/auth/signout");
  },

  me() {
    return apiClient.get<ApiResponse<unknown>>("/auth/me");
  },
};
