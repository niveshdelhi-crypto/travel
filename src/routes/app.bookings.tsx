import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app/app-shell";
import { Badge, EmptyState, Panel, Skeleton } from "@/components/app/primitives";
import type { BadgeTone } from "@/types";
import { bookingsService } from "@/services";
import { useAuthStore } from "@/store/auth.store";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/bookings")({
  component: BookingsPage,
});

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

function BookingsPage() {
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const bookingsQuery = useQuery({
    queryKey: ["bookings", { page, pageSize }],
    queryFn: () => bookingsService.list({ page, pageSize }),
    enabled: Boolean(user),
    placeholderData: keepPreviousData,
  });

  return (
    <AppShell title="Bookings">
      <div className="p-6">
        <Panel>
          {!user ? (
            <EmptyState
              icon={AlertTriangle}
              title="Sign in required"
              description="Authenticate as an agent or administrator to review recorded corridor bookings."
            />
          ) : bookingsQuery.isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : bookingsQuery.isError ? (
            <EmptyState
              icon={AlertTriangle}
              title="Unable to load bookings"
              description="The bookings API returned an error. Confirm the Nest API is running and migrations are applied."
            />
          ) : !bookingsQuery.data?.data.length ? (
            <EmptyState
              title="No bookings yet"
              description="Confirmed leads closed through the revenue checkpoint appear here automatically."
            />
          ) : (
            <>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                    {bookingsQuery.data.data.map((row) => (
                      <tr key={row.id} className="border-b border-border/80 hover:bg-muted/30">
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {new Date(row.created_at).toLocaleString()}
                        </td>
                        <td className="max-w-[200px] px-4 py-3">
                          <div className="font-medium text-foreground">{row.lead.customer_name}</div>
                          <div className="truncate text-xs text-muted-foreground">{row.lead.customer_email}</div>
                        </td>
                        <td className="max-w-[260px] px-4 py-3 text-muted-foreground">
                          <span className="line-clamp-2">
                            {row.lead.pickup_location} → {row.lead.drop_location}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-foreground">
                          {formatMoney(row.gross_revenue, row.currency)}
                        </td>
                        <td className="max-w-[220px] px-4 py-3 text-muted-foreground">
                          {row.partner_name ? (
                            <div className="font-medium text-foreground/90">{row.partner_name}</div>
                          ) : (
                            <span className="text-xs opacity-70">—</span>
                          )}
                          {row.confirmation_reference ? (
                            <div className="truncate text-xs">Ref: {row.confirmation_reference}</div>
                          ) : null}
                        </td>
                        <td className="max-w-[160px] px-4 py-3 text-muted-foreground">
                          {row.recorder?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <BookingStatusBadge status={row.lead.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
                <span>
                  Page {bookingsQuery.data.page} of {bookingsQuery.data.totalPages} · {bookingsQuery.data.total}{" "}
                  total
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || bookingsQuery.isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-foreground hover:bg-accent disabled:opacity-45"
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </button>
                  <button
                    type="button"
                    disabled={page >= bookingsQuery.data.totalPages || bookingsQuery.isFetching}
                    onClick={() => setPage((p) => p + 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-foreground hover:bg-accent disabled:opacity-45"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}

function BookingStatusBadge({ status }: { status: string }) {
  let tone: BadgeTone = "neutral";
  if (status === "COMPLETED") tone = "success";
  if (status === "CONFIRMED") tone = "success";
  return <Badge tone={tone}>{status.charAt(0) + status.slice(1).toLowerCase().replace("_", " ")}</Badge>;
}
