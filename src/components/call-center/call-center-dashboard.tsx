import { Badge, MetricWidget, Panel, PanelHeader, Skeleton, StatCard } from "@/components/app/primitives";
import { telephonyService } from "@/services";
import { getSocketStatus } from "@/services/socket";
import { useAuthStore } from "@/store/auth.store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Phone,
  PhoneIncoming,
  PhoneMissed,
  Timer,
  CalendarCheck,
  DollarSign,
  Radio,
  RefreshCw,
} from "lucide-react";

export const callCenterQueryKeys = {
  root: ["call-center"] as const,
  metrics: () => [...callCenterQueryKeys.root, "metrics"] as const,
};

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(amount);
}

export function CallCenterDashboard() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const metricsQuery = useQuery({
    queryKey: callCenterQueryKeys.metrics(),
    queryFn: () => telephonyService.getCenterMetrics(),
    refetchInterval: 30_000,
    enabled: Boolean(user),
  });

  const callsQuery = useQuery({
    queryKey: [...callCenterQueryKeys.root, "recent"],
    queryFn: () => telephonyService.list({ page: 1, pageSize: 20 }),
    enabled: Boolean(user),
  });

  const metrics = metricsQuery.data;

  return (
    <div className="space-y-4 p-3 sm:space-y-6 sm:p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Telnyx call control</p>
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Call center</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Inbound-first CRM entry · live Telnyx webhooks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={getSocketStatus() === "connected" ? "success" : "warning"}>
            <Radio className="mr-1 inline h-3 w-3" />
            Realtime {getSocketStatus()}
          </Badge>
          <button
            type="button"
            onClick={() =>
              void queryClient.invalidateQueries({ queryKey: callCenterQueryKeys.root })
            }
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-accent"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {metricsQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : metrics ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Today's calls" value={String(metrics.todays_calls)} icon={Phone} />
            <StatCard
              label="Connected"
              value={String(metrics.connected_calls)}
              icon={PhoneIncoming}
              trend="up"
            />
            <StatCard label="Missed" value={String(metrics.missed_calls)} icon={PhoneMissed} />
            <StatCard
              label="Avg duration"
              value={formatDuration(metrics.average_duration_seconds)}
              icon={Timer}
            />
            <StatCard
              label="Bookings created"
              value={String(metrics.bookings_created)}
              icon={CalendarCheck}
            />
            <StatCard
              label="Revenue generated"
              value={formatMoney(metrics.revenue_generated)}
              icon={DollarSign}
              trend="up"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricWidget label="Inbound today" value={metrics.inbound_calls_today} tone="success" />
            <MetricWidget
              label="Connect rate"
              value={
                metrics.todays_calls > 0
                  ? `${Math.round((metrics.connected_calls / metrics.todays_calls) * 100)}%`
                  : "—"
              }
              tone="neutral"
            />
          </div>
        </>
      ) : null}

      <Panel>
        <PanelHeader title="Recent calls" subtitle="Telnyx + legacy provider records" />
        {callsQuery.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {callsQuery.data?.data.map((call) => (
              <div
                key={call.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {call.direction === "INBOUND" ? call.from_number : call.to_number}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {call.direction} · {call.provider} · {call.status}
                    {call.duration_seconds != null ? ` · ${formatDuration(call.duration_seconds)}` : ""}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {call.lead?.customer_name ?? "No lead"}
                  <br />
                  {new Date(call.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
