import { cookies } from "next/headers";
import type { LeadListParams, LeadMetrics, PaginatedLeads } from "./types";

const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://localhost:4000/api";

async function serverRequest<T>(path: string): Promise<T> {
  const cookieStore = await cookies();
  const response = await fetch(`${API_INTERNAL_URL}${path}`, {
    cache: "no-store",
    headers: { Cookie: cookieStore.toString() },
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

export function listServerLeads(params: LeadListParams = {}) {
  const searchParams = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 25),
  });
  if (params.status && params.status !== "ALL") searchParams.set("status", params.status);
  return serverRequest<PaginatedLeads>(`/leads?${searchParams.toString()}`);
}

export function listServerMyLeads(params: LeadListParams = {}) {
  const searchParams = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 100),
  });
  if (params.status && params.status !== "ALL") searchParams.set("status", params.status);
  return serverRequest<PaginatedLeads>(`/leads/my?${searchParams.toString()}`);
}

export function listServerAdminLeads(params: LeadListParams = {}) {
  const searchParams = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 100),
  });
  if (params.status && params.status !== "ALL") searchParams.set("status", params.status);
  return serverRequest<PaginatedLeads>(`/leads/admin?${searchParams.toString()}`);
}

export function getServerLeadMetrics() {
  return serverRequest<LeadMetrics>("/leads/metrics");
}
