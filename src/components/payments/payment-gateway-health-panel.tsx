import { Badge, Panel, PanelHeader, Skeleton } from "@/components/app/primitives";
import { formatDateTime } from "@/lib/payments/format";
import type { PaymentGatewayHealthRow } from "@/types/payments-orchestration";
import { Activity, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

function statusTone(status: PaymentGatewayHealthRow["status"]) {
  switch (status) {
    case "CONNECTED":
      return "success" as const;
    case "DEGRADED":
      return "warning" as const;
    case "FAILED":
      return "danger" as const;
  }
}

function StatusIcon({ status }: { status: PaymentGatewayHealthRow["status"] }) {
  if (status === "CONNECTED") return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (status === "DEGRADED") return <AlertTriangle className="h-4 w-4 text-warning" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
}

function CheckPill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        ok
          ? "border-success/30 bg-success/10 text-success"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      }`}
    >
      {label}
    </span>
  );
}

export function PaymentGatewayHealthPanel({
  rows,
  loading,
  checkedAt,
}: {
  rows: PaymentGatewayHealthRow[];
  loading?: boolean;
  checkedAt?: string;
}) {
  if (loading) {
    return (
      <Panel>
        <PanelHeader title="Gateway health" subtitle="Live PayPal API validation" />
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader
        title="Gateway health"
        subtitle="OAuth, Orders API, Capture API, card eligibility, currency — verified against provider"
        right={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            {checkedAt ? formatDateTime(checkedAt) : "—"}
          </div>
        }
      />
      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <div
            key={row.gateway_id}
            className="rounded-lg border border-border bg-surface-2/30 px-3 py-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">{row.gateway_name}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {row.gateway_type}
                  {row.environment ? ` · ${row.environment}` : ""}
                </p>
              </div>
              <StatusIcon status={row.status} />
            </div>

            <div className="mt-2">
              <Badge tone={statusTone(row.status)}>{row.status}</Badge>
            </div>

            {row.gateway_type === "paypal" ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                <CheckPill label="OAuth" ok={row.oauth_valid} />
                <CheckPill label="Orders" ok={row.orders_api} />
                <CheckPill label="Capture" ok={row.capture_api} />
                {row.card_processing_eligible !== null ? (
                  <CheckPill label="Cards" ok={row.card_processing_eligible} />
                ) : null}
                {row.currency_supported !== null && row.currency_tested ? (
                  <CheckPill
                    label={row.currency_supported ? row.currency_tested : `${row.currency_tested}?`}
                    ok={row.currency_supported}
                  />
                ) : null}
              </div>
            ) : null}

            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p>
                Last success:{" "}
                <span className="text-foreground">
                  {row.last_successful_charge
                    ? formatDateTime(row.last_successful_charge)
                    : "—"}
                </span>
              </p>
              <p>
                Last failure:{" "}
                <span className="text-foreground">
                  {row.last_failed_charge ? formatDateTime(row.last_failed_charge) : "—"}
                </span>
              </p>
            </div>

            {row.detail ? <p className="mt-2 text-xs text-warning">{row.detail}</p> : null}
          </div>
        ))}
      </div>
    </Panel>
  );
}
