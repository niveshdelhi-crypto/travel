import { Badge, EmptyState, MetricWidget, Panel, PanelHeader, Skeleton, StatCard } from "@/components/app/primitives";
import { useBookingOperationsQueue, useBookingOperationsRealtime, useFinanceOverview } from "@/hooks/use-booking-operations-realtime";
import { bookingOrchestrationService } from "@/services/booking-orchestration.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingOpsQueryKeys } from "@/hooks/use-booking-operations-realtime";
import { paymentQueryKeys } from "@/lib/payments/query-keys";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  FileText,
  Radio,
  RefreshCw,
  Ticket,
  TrendingUp,
  Users,
  Wallet,
  CreditCard,
} from "lucide-react";
import { useState } from "react";
import { getSocketStatus } from "@/services/socket";

function lifecycleTone(status: string) {
  if (status.includes("SUCCESS") || status.includes("CONFIRMED") || status === "COMPLETED") return "success" as const;
  if (status.includes("PENDING") || status.includes("PROCESSING")) return "warning" as const;
  if (status.includes("FAILED") || status === "CHARGEBACK") return "danger" as const;
  return "neutral" as const;
}

function formatMoney(amount: string | number, currency = "USD") {
  const n = Number(amount);
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number.isFinite(n) ? n : 0);
}

export function BookingOperationsDashboard() {
  const queryClient = useQueryClient();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  useBookingOperationsRealtime();
  const queueQuery = useBookingOperationsQueue();
  const financeQuery = useFinanceOverview();

  const refundsQuery = useQuery({
    queryKey: bookingOpsQueryKeys.refunds(),
    queryFn: () => bookingOrchestrationService.listRefundQueue(),
  });

  const suppliersQuery = useQuery({
    queryKey: bookingOpsQueryKeys.suppliers(),
    queryFn: () => bookingOrchestrationService.listSupplierQueue(),
  });

  const timelineQuery = useQuery({
    queryKey: [...bookingOpsQueryKeys.root, "timeline", selectedBookingId] as const,
    queryFn: () => bookingOrchestrationService.getTimeline(selectedBookingId!),
    enabled: Boolean(selectedBookingId),
  });

  const voucherMutation = useMutation({
    mutationFn: (bookingId: string) => bookingOrchestrationService.generateVoucher(bookingId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: bookingOpsQueryKeys.root }),
  });

  const requestPaymentMutation = useMutation({
    mutationFn: (bookingId: string) => bookingOrchestrationService.requestPayment(bookingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingOpsQueryKeys.root });
      void queryClient.invalidateQueries({ queryKey: paymentQueryKeys.root });
    },
  });

  const finance = financeQuery.data;

  return (
    <div className="space-y-4 p-3 sm:space-y-6 sm:p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Travel operations</p>
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Booking orchestration console</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Radio className={`h-3.5 w-3.5 ${getSocketStatus() === "connected" ? "text-success" : "text-warning"}`} />
          Realtime {getSocketStatus()}
        </div>
      </div>

      {financeQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : finance ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Revenue today" value={formatMoney(finance.revenueToday)} icon={Wallet} trend="up" />
          <StatCard label="Monthly revenue" value={formatMoney(finance.revenueMonth)} icon={TrendingUp} trend="up" />
          <StatCard label="Gateway success" value={`${Math.round((finance.gatewaySuccessRate[0]?.rate ?? 0) * 100)}%`} icon={BadgeCheck} />
          <StatCard label="Recurring travelers" value={String(finance.recurringRevenueTravelers)} icon={Users} />
        </div>
      ) : null}

      {finance ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricWidget label="Failed transactions" value={finance.failedTransactions} tone="danger" />
          <MetricWidget label="Pending refunds" value={finance.pendingRefunds} tone="warning" />
          <MetricWidget label="Supplier queue" value={finance.supplierPayoutPending} tone="neutral" />
          <MetricWidget label="Bookings in progress" value={finance.bookingsInProgress} tone="success" />
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHeader
            title="Booking queue"
            subtitle="Active orchestration pipeline"
            right={
              <button
                type="button"
                onClick={() => void queryClient.invalidateQueries({ queryKey: bookingOpsQueryKeys.root })}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-accent"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
            }
          />
          {queueQuery.isLoading ? (
            <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !queueQuery.data?.data.length ? (
            <EmptyState icon={AlertTriangle} title="Queue is empty" description="No active bookings in the orchestration pipeline." />
          ) : (
            <ul className="divide-y divide-border">
              {queueQuery.data.data.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedBookingId(row.id)}
                    className={`flex w-full flex-col gap-2 px-4 py-3 text-left hover:bg-muted/20 sm:flex-row sm:items-center sm:justify-between ${
                      selectedBookingId === row.id ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : ""
                    }`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{row.lead.customer_name}</span>
                        <Badge tone={lifecycleTone(row.lifecycle_status)}>{row.lifecycle_status.replaceAll("_", " ")}</Badge>
                        {row.traveler?.is_recurring ? <Badge tone="primary">Recurring</Badge> : null}
                        {row.traveler?.is_vip ? <Badge tone="warning">VIP</Badge> : null}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {row.lead.pickup_location} → {row.lead.drop_location} · {formatMoney(row.gross_revenue, row.currency)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(row.lifecycle_status === "PAYMENT_PENDING" ||
                        row.lifecycle_status === "BOOKING_REQUESTED" ||
                        row.lifecycle_status === "PAYMENT_FAILED") ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            requestPaymentMutation.mutate(row.id);
                          }}
                          disabled={requestPaymentMutation.isPending}
                          className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/15 disabled:opacity-50"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          {requestPaymentMutation.isPending ? "Sending…" : "Request Payment"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); voucherMutation.mutate(row.id); }}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs hover:bg-accent"
                      >
                        <Ticket className="h-3.5 w-3.5" /> Voucher
                      </button>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <PanelHeader title="Booking timeline" subtitle="Lifecycle audit trail" />
          {!selectedBookingId ? (
            <p className="p-6 text-sm text-muted-foreground">Select a booking to inspect lifecycle events.</p>
          ) : timelineQuery.isLoading ? (
            <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <ol className="space-y-0 px-4 py-3">
              {(timelineQuery.data as Array<{ id: string; from_status: string | null; to_status: string; created_at: string }>)?.map((event) => (
                <li key={event.id} className="border-l border-border py-2 pl-4">
                  <p className="text-sm font-medium">{event.to_status.replaceAll("_", " ")}</p>
                  <p className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Refund console" subtitle="Finance review queue" />
          <RefundQueue items={(refundsQuery.data as unknown[]) ?? []} />
        </Panel>
        <Panel>
          <PanelHeader title="Supplier reservations" subtitle="Manual/API supplier pipeline" />
          <SupplierQueue items={(suppliersQuery.data as unknown[]) ?? []} />
        </Panel>
      </div>
    </div>
  );
}

function RefundQueue({ items }: { items: unknown[] }) {
  const queryClient = useQueryClient();
  const approve = useMutation({
    mutationFn: (id: string) => bookingOrchestrationService.approveRefund(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: bookingOpsQueryKeys.refunds() }),
  });

  if (!items.length) return <p className="p-6 text-sm text-muted-foreground">No pending refund approvals.</p>;

  return (
    <ul className="divide-y divide-border">
      {(items as Array<{ id: string; status: string; amount: string | number; booking?: { lead?: { customer_name?: string } } }>).map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-sm font-medium">{item.booking?.lead?.customer_name ?? "Booking"}</p>
            <p className="text-xs text-muted-foreground">{item.status} · {formatMoney(item.amount)}</p>
          </div>
          <button type="button" onClick={() => approve.mutate(item.id)} className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-accent">
            Approve
          </button>
        </li>
      ))}
    </ul>
  );
}

function SupplierQueue({ items }: { items: unknown[] }) {
  if (!items.length) return <p className="p-6 text-sm text-muted-foreground">Supplier queue is clear.</p>;
  return (
    <ul className="divide-y divide-border">
      {(items as Array<{ id: string; status: string; supplier?: { name?: string }; booking?: { lead?: { customer_name?: string } } }>).map((item) => (
        <li key={item.id} className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">{item.supplier?.name ?? "Supplier"}</p>
            <Badge tone="warning">{item.status}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.booking?.lead?.customer_name}</p>
        </li>
      ))}
    </ul>
  );
}
