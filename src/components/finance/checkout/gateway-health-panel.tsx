import { Badge, Panel, PanelHeader, Skeleton } from "@/components/app/primitives";
import type { GatewayHealthRow } from "@/types/payments-orchestration";
import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";

export function GatewayHealthPanel({
  rows,
  loading,
  compact,
}: {
  rows: GatewayHealthRow[];
  loading?: boolean;
  compact?: boolean;
}) {
  if (loading) {
    return (
      <div className={compact ? "grid gap-2 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2 p-4"}>
        {Array.from({ length: compact ? 3 : 4 }).map((_, i) => (
          <Skeleton key={i} className={compact ? "h-24 w-full" : "h-14 w-full"} />
        ))}
      </div>
    );
  }

  const content = rows.map((row) => (
    <div
      key={row.gateway_id}
      className="rounded-lg border border-border bg-surface-2/30 px-3 py-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{row.gateway_name}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{row.gateway_type}</p>
        </div>
        {row.status === "CONNECTED" || (row.healthy && row.is_active) ? (
          <CheckCircle2 className="h-4 w-4 text-success" />
        ) : row.status === "FAILED" ? (
          <AlertTriangle className="h-4 w-4 text-destructive" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-warning" />
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Badge
          tone={
            !row.is_active
              ? "neutral"
              : row.status === "CONNECTED" || row.healthy
                ? "success"
                : row.status === "FAILED"
                  ? "danger"
                  : "warning"
          }
        >
          {!row.is_active
            ? "Inactive"
            : row.status ?? (row.healthy ? "CONNECTED" : "DEGRADED")}
        </Badge>
        {row.latency_ms > 0 ? (
          <Badge tone="neutral">{row.latency_ms}ms</Badge>
        ) : null}
        {row.success_rate_24h !== null ? (
          <Badge tone={row.success_rate_24h >= 80 ? "success" : "warning"}>
            {row.success_rate_24h}% 24h
          </Badge>
        ) : null}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[10px] text-muted-foreground">
        <div>
          <p className="font-semibold text-foreground">{row.attempts_24h}</p>
          Attempts
        </div>
        <div>
          <p className="font-semibold text-success">{row.captured_24h}</p>
          Captured
        </div>
        <div>
          <p className="font-semibold text-destructive">{row.failed_24h}</p>
          Failed
        </div>
      </div>
      {row.health_message ? (
        <p className="mt-2 text-xs text-warning">{row.health_message}</p>
      ) : null}
    </div>
  ));

  if (compact) {
    return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{content}</div>;
  }

  return (
    <Panel>
      <PanelHeader
        title="Gateway Health"
        subtitle="OAuth probes and 24-hour attempt metrics"
        right={<Activity className="h-4 w-4 text-muted-foreground" />}
      />
      <div className="grid gap-3 p-4 sm:grid-cols-2">{content}</div>
    </Panel>
  );
}
