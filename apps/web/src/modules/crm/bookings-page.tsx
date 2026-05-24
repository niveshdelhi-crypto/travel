"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge, CrmPage, EmptyState, Panel } from "@/components/crm/primitives";
import type { BadgeTone } from "@/components/crm/primitives";
import { crmQueryKeys } from "@/lib/crm/query-keys";
import type { LeadStatus } from "@/lib/leads/types";
import { bookingsService } from "@/services/bookings.service";

export function BookingsPage() {
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const bookingsQuery = useQuery({
    queryKey: crmQueryKeys.bookings(page, pageSize),
    queryFn: () => bookingsService.list({ page, pageSize }),
    placeholderData: keepPreviousData,
  });

  const data = bookingsQuery.data;

  return (
    <CrmPage title="Bookings">
      <div className="p-6">
        <Panel>
          {bookingsQuery.isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-[#eef2f7]" />
              ))}
            </div>
          ) : bookingsQuery.isError ? (
            <EmptyState
              icon={AlertTriangle}
              title="Unable to load bookings"
              description="Confirm the Nest API is running and migrations are applied."
            />
          ) : !data?.data.length ? (
            <EmptyState
              title="No bookings yet"
              description="Confirmed leads closed through the revenue checkpoint appear here automatically."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#d7dde8] text-left text-xs font-semibold uppercase text-[#637083]">
                      <th className="px-4 py-3">Recorded</th>
                      <th className="px-4 py-3">Traveler</th>
                      <th className="px-4 py-3">Route</th>
                      <th className="px-4 py-3">Revenue</th>
                      <th className="px-4 py-3">Partner / ref</th>
                      <th className="px-4 py-3">Recorder</th>
                      <th className="px-4 py-3">Lead status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((booking) => (
                      <tr key={booking.id} className="border-t border-[#eef2f7]">
                        <td className="px-4 py-3 text-[#637083]">
                          {formatDate(booking.created_at)}
                        </td>
                        <td className="px-4 py-3 font-medium">{booking.lead.customer_name}</td>
                        <td className="px-4 py-3 text-[#36445a]">
                          {booking.lead.pickup_location} → {booking.lead.drop_location}
                        </td>
                        <td className="px-4 py-3 font-semibold tabular-nums">
                          {formatMoney(String(booking.gross_revenue), booking.currency)}
                        </td>
                        <td className="px-4 py-3 text-[#637083]">
                          {booking.partner_name ?? booking.confirmation_reference ?? "—"}
                        </td>
                        <td className="px-4 py-3">{booking.recorder?.name ?? "—"}</td>
                        <td className="px-4 py-3">
                          <Badge tone={statusTone(booking.lead.status as LeadStatus)}>
                            {booking.lead.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                onPage={setPage}
                disabled={bookingsQuery.isFetching}
              />
            </>
          )}
        </Panel>
      </div>
    </CrmPage>
  );
}

function Pagination({
  page,
  totalPages,
  onPage,
  disabled,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-t border-[#d7dde8] px-4 py-3">
      <span className="text-sm text-[#637083]">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled || page <= 1}
          onClick={() => onPage(page - 1)}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-[#d7dde8] px-2 text-sm disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </button>
        <button
          type="button"
          disabled={disabled || page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-[#d7dde8] px-2 text-sm disabled:opacity-40"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function statusTone(status: LeadStatus): BadgeTone {
  if (status === "CONFIRMED" || status === "COMPLETED") return "success";
  if (status === "NEGOTIATING") return "warning";
  if (status === "CONTACTED") return "info";
  return "neutral";
}

function formatMoney(amount: string, currency: string) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.length === 3 ? currency : "USD",
    }).format(n);
  } catch {
    return `${amount} ${currency}`;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
