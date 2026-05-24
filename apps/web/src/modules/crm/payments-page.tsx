"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { CrmPage, EmptyState, Panel } from "@/components/crm/primitives";
import { crmQueryKeys } from "@/lib/crm/query-keys";
import { paymentsService } from "@/services/payments.service";

export function PaymentsPage() {
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const paymentsQuery = useQuery({
    queryKey: crmQueryKeys.payments(page, pageSize),
    queryFn: () => paymentsService.list({ page, pageSize }),
    placeholderData: keepPreviousData,
  });

  const data = paymentsQuery.data;

  return (
    <CrmPage title="Payments">
      <div className="p-6">
        <Panel>
          {paymentsQuery.isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-[#eef2f7]" />
              ))}
            </div>
          ) : paymentsQuery.isError ? (
            <EmptyState
              icon={AlertTriangle}
              title="Unable to load payments"
              description="Confirm the Nest API is running and migrations are applied."
            />
          ) : !data?.data.length ? (
            <EmptyState
              title="No payments yet"
              description="Payment rows are created when leads are closed as booked."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#d7dde8] text-left text-xs font-semibold uppercase text-[#637083]">
                      <th className="px-4 py-3">Recorded</th>
                      <th className="px-4 py-3">Traveler</th>
                      <th className="px-4 py-3">Kind</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Booking ref</th>
                      <th className="px-4 py-3">Recorder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((payment) => (
                      <tr key={payment.id} className="border-t border-[#eef2f7]">
                        <td className="px-4 py-3 text-[#637083]">
                          {formatDate(payment.created_at)}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {payment.booking.lead.customer_name}
                        </td>
                        <td className="px-4 py-3 capitalize text-[#36445a]">
                          {payment.kind.replaceAll("_", " ")}
                        </td>
                        <td className="px-4 py-3 font-semibold tabular-nums">
                          {formatMoney(String(payment.amount), payment.currency)}
                        </td>
                        <td className="px-4 py-3 text-[#637083]">
                          {payment.booking.confirmation_reference ??
                            payment.booking.partner_name ??
                            "—"}
                        </td>
                        <td className="px-4 py-3">{payment.recorder?.name ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-[#d7dde8] px-4 py-3">
                <span className="text-sm text-[#637083]">
                  Page {data.page} of {data.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={paymentsQuery.isFetching || page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-[#d7dde8] px-2 text-sm disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </button>
                  <button
                    type="button"
                    disabled={paymentsQuery.isFetching || page >= data.totalPages}
                    onClick={() => setPage(page + 1)}
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-[#d7dde8] px-2 text-sm disabled:opacity-40"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </Panel>
      </div>
    </CrmPage>
  );
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
