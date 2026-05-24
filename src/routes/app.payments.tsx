import { createFileRoute } from "@tanstack/react-router";
import { requireAdminRoute } from "@/lib/route-guards";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app/app-shell";
import { EmptyState, Panel, Skeleton } from "@/components/app/primitives";
import { paymentsService } from "@/services";
import { useAuthStore } from "@/store/auth.store";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/payments")({
  beforeLoad: requireAdminRoute,
  component: PaymentsPage,
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

function PaymentsPage() {
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const paymentsQuery = useQuery({
    queryKey: ["payments", { page, pageSize }],
    queryFn: () => paymentsService.listRecognized({ page, pageSize }),
    enabled: Boolean(user),
    placeholderData: keepPreviousData,
  });

  return (
    <AppShell title="Payments">
      <div className="p-3 sm:p-4 md:p-6">
        <Panel>
          {!user ? (
            <EmptyState
              icon={AlertTriangle}
              title="Sign in required"
              description="Authenticate to review recognized booking revenue postings."
            />
          ) : paymentsQuery.isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : paymentsQuery.isError ? (
            <EmptyState
              icon={AlertTriangle}
              title="Unable to load payments"
              description="The payments ledger API returned an error. Confirm the Nest API is running."
            />
          ) : !paymentsQuery.data?.data.length ? (
            <EmptyState
              title="No ledger entries"
              description="Each closed booking emits a paired payment row — they will populate here automatically."
            />
          ) : (
            <>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3">Posted</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Kind</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Pickup</th>
                      <th className="px-4 py-3">Memo</th>
                      <th className="px-4 py-3">Recorder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentsQuery.data.data.map((row) => (
                      <tr key={row.id} className="border-b border-border/80 hover:bg-muted/30">
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {new Date(row.created_at).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-foreground">
                          {formatMoney(row.amount, row.currency)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{row.kind.replace(/_/g, " ")}</td>
                        <td className="max-w-[200px] px-4 py-3 font-medium text-foreground">
                          {row.booking.lead.customer_name}
                        </td>
                        <td className="max-w-[220px] px-4 py-3 text-muted-foreground">
                          <span className="line-clamp-2">{row.booking.lead.pickup_location}</span>
                        </td>
                        <td className="max-w-[220px] truncate px-4 py-3 text-muted-foreground">
                          {row.memo ?? "—"}
                        </td>
                        <td className="max-w-[140px] px-4 py-3 text-muted-foreground">
                          {row.recorder?.name ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
                <span>
                  Page {paymentsQuery.data.page} of {paymentsQuery.data.totalPages} ·{" "}
                  {paymentsQuery.data.total} total
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || paymentsQuery.isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-foreground hover:bg-accent disabled:opacity-45"
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </button>
                  <button
                    type="button"
                    disabled={page >= paymentsQuery.data.totalPages || paymentsQuery.isFetching}
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
