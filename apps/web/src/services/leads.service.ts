"use client";

import { apiRequest } from "@/lib/api";
import type {
  CreateLeadInput,
  Lead,
  LeadListParams,
  LeadMetrics,
  PublicLeadResponse,
  LeadStatus,
  PaginatedLeads,
} from "@/lib/leads/types";

export const leadsService = {
  createLead(input: CreateLeadInput, idempotencyKey?: string) {
    return apiRequest<PublicLeadResponse>({
      url: "/leads/public",
      method: "POST",
      data: input,
      skipAuthRefresh: true,
      skipCsrf: true,
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    });
  },

  listLeads(params: LeadListParams = {}) {
    return apiRequest<PaginatedLeads>({
      url: "/leads",
      method: "GET",
      params: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 25,
        ...(params.status && params.status !== "ALL" ? { status: params.status } : {}),
      },
    });
  },

  listMyLeads(params: LeadListParams = {}) {
    return apiRequest<PaginatedLeads>({
      url: "/leads/my",
      method: "GET",
      params: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 25,
        ...(params.status && params.status !== "ALL" ? { status: params.status } : {}),
      },
    });
  },

  listAdminLeads(params: LeadListParams = {}) {
    return apiRequest<PaginatedLeads>({
      url: "/leads/admin",
      method: "GET",
      params: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 25,
        ...(params.status && params.status !== "ALL" ? { status: params.status } : {}),
      },
    });
  },

  updateLeadStatus(id: string, status: LeadStatus) {
    return apiRequest<Lead>({
      url: `/leads/${id}/status`,
      method: "PATCH",
      data: { status },
    });
  },

  patchLead(
    id: string,
    input: { status?: LeadStatus; follow_up_at?: string | null; booking_value?: number },
  ) {
    return apiRequest<Lead>({
      url: `/leads/${id}`,
      method: "PATCH",
      data: input,
    });
  },

  deleteLead(id: string) {
    return apiRequest<void>({
      url: `/leads/${id}`,
      method: "DELETE",
    });
  },

  getLeadMetrics() {
    return apiRequest<LeadMetrics>({
      url: "/leads/metrics",
      method: "GET",
    });
  },

  updateLead(id: string, input: { status?: LeadStatus; booking_value?: number }) {
    return apiRequest<Lead>({
      url: `/leads/${id}`,
      method: "PATCH",
      data: input,
    });
  },

  addLeadNote(id: string, body: string) {
    return apiRequest<Lead["notes"][number]>({
      url: `/leads/${id}/notes`,
      method: "POST",
      data: { body },
    });
  },

  recordCall(id: string) {
    return apiRequest<Lead>({
      url: `/leads/${id}/calls`,
      method: "POST",
    });
  },
};
