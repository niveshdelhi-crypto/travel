import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  EmptyState,
  MetricWidget,
  Panel,
  PanelHeader,
  Skeleton,
  StatCard,
} from "@/components/app/primitives";
import { GatewayHealthPanel } from "@/components/finance/checkout/gateway-health-panel";
import { usePaymentRealtime } from "@/hooks/use-payment-realtime";
import { formatDateTime, formatMoney, statusTone } from "@/lib/payments/format";
import { paymentQueryKeys } from "@/lib/payments/query-keys";
import { paymentsOrchestrationService } from "@/services/payments-orchestration.service";
import { getSocketStatus } from "@/services/socket";
import type { PaymentSessionQueueItem } from "@/types/payments-orchestration";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Radio,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";

function QueueTable({ rows, loading }: { rows: PaymentSessionQueueItem[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No payments in queue"
        description="When sales agents create payment sessions, they will appear here for finance processing."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2/60 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Booking ID</th>
            <th className="px-4 py-3">Agent</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Currency</th>
            <th className="px-4 py-3">Gateway</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border/60 transition-colors hover:bg-surface-2/40"
            >
              <td className="px-4 py-3 font-medium text-foreground">{row.customer_name}</td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                {row.booking_id.slice(0, 8)}…
              </td>
              <td className="px-4 py-3 text-muted-foreground">{row.agent_name}</td>
              <td className="px-4 py-3 font-semibold tabular-nums">
                {formatMoney(row.amount, row.currency)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{row.currency}</td>
              <td className="px-4 py-3">{row.gateway_name}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDateTime(row.created_at)}</td>
              <td className="px-4 py-3">
                <Badge tone={statusTone(row.status)}>{row.status}</Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  to="/app/checkout-console/$sessionId"
                  params={{ sessionId: row.id }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
                >
                  Open Checkout
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FinanceDashboard() {
  usePaymentRealtime();
  const socketStatus = getSocketStatus();

  const metricsQuery = useQuery({
    queryKey: paymentQueryKeys.paymentSessionMetrics(),
    queryFn: () => paymentsOrchestrationService.getPaymentSessionMetrics(),
  });

  const queueQuery = useQuery({
    queryKey: paymentQueryKeys.paymentSessionQueue(),
    queryFn: () => paymentsOrchestrationService.listPaymentSessionQueue(),
  });

  const gatewayHealthQuery = useQuery({
    queryKey: paymentQueryKeys.gatewayHealth(),
    queryFn: () => paymentsOrchestrationService.getFinanceGatewayHealth(),
  });

  const metrics = metricsQuery.data;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            Finance Operations
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Assisted Checkout Queue
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Process customer payments during live sales calls. Sessions are created by agents and
            completed by finance administrators.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground">
          <Radio
            className={`h-3.5 w-3.5 ${socketStatus === "connected" ? "text-success" : "text-warning"}`}
          />
          Realtime {socketStatus}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          label="Pending Payments"
          value={metricsQuery.isLoading ? "…" : String(metrics?.pending_payments ?? 0)}
          icon={Clock}
        />
        <StatCard
          label="Processing"
          value={metricsQuery.isLoading ? "…" : String(metrics?.processing ?? 0)}
          icon={Wallet}
        />
        <StatCard
          label="Successful Today"
          value={metricsQuery.isLoading ? "…" : String(metrics?.successful_today ?? 0)}
          icon={CheckCircle2}
        />
        <StatCard
          label="Failed Today"
          value={metricsQuery.isLoading ? "…" : String(metrics?.failed_today ?? 0)}
          icon={XCircle}
        />
        <StatCard
          label="Revenue Today"
          value={
            metricsQuery.isLoading
              ? "…"
              : metrics
                ? formatMoney(metrics.revenue_today, "USD")
                : "$0.00"
          }
          icon={DollarSign}
        />
        <StatCard
          label="Revenue This Month"
          value={
            metricsQuery.isLoading
              ? "…"
              : metrics
                ? formatMoney(metrics.revenue_this_month, "USD")
                : "$0.00"
          }
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricWidget
          label="Queue throughput"
          value={`${queueQuery.data?.length ?? 0} active`}
          sub="Pending, processing, and failed sessions awaiting action"
        />
        <MetricWidget
          label="Finance SLA"
          value="< 15 min"
          sub="Target time from session creation to checkout completion"
        />
      </div>

      <GatewayHealthPanel rows={gatewayHealthQuery.data ?? []} loading={gatewayHealthQuery.isLoading} compact />

      <Panel>
        <PanelHeader
          title="Payment Queue"
          subtitle="Open a session in the checkout console to process payment with the selected gateway."
        />
        <QueueTable rows={queueQuery.data ?? []} loading={queueQuery.isLoading} />
      </Panel>
    </div>
  );
}
