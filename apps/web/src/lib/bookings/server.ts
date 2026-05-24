import { cookies } from "next/headers";
import type { PaginatedBookings, PaginatedPayments } from "./types";

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

export function listServerBookings(page = 1, pageSize = 5) {
  const searchParams = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return serverRequest<PaginatedBookings>(`/bookings?${searchParams.toString()}`);
}

export function listServerPayments(page = 1, pageSize = 5) {
  const searchParams = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return serverRequest<PaginatedPayments>(`/payments?${searchParams.toString()}`);
}
