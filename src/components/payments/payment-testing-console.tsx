import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Badge,
  EmptyState,
  Panel,
  PanelHeader,
  Skeleton,
} from "@/components/app/primitives";
import { AuditTimeline } from "@/components/payments/audit-timeline";
import { formatDateTime, formatMoney } from "@/lib/payments/format";
import {
  paymentTestingService,
  type PayPalEnvironment,
  type PaymentTestingCaptureRow,
  type PaymentTestingFailureRow,
} from "@/services/payment-testing.service";
import {
  AlertTriangle,
  FlaskConical,
  RefreshCw,
  RotateCcw,
  ScrollText,
  Ban,
  Undo2,
} from "lucide-react";

const queryKey = (env: PayPalEnvironment) => ["payment-testing", env] as const;

export function PaymentTestingConsole() {
  const [environment, setEnvironment] = useState<PayPalEnvironment>("sandbox");
  const [auditTarget, setAuditTarget] = useState<{
    resourceType: string;
    resourceId: string;
    label: string;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const consoleQuery = useQuery({
    queryKey: queryKey(environment),
    queryFn: () => paymentTestingService.getConsole(environment),
  });

  const auditQuery = useQuery({
    queryKey: [...queryKey(environment), "audit", auditTarget] as const,
    queryFn: () =>
      paymentTestingService.getAudit(auditTarget!.resourceType, auditTarget!.resourceId),
    enabled: Boolean(auditTarget),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKey(environment) });
    if (auditTarget) void auditQuery.refetch();
  };

  const retryMutation = useMutation({
    mutationFn: paymentTestingService.retryCapture,
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const voidMutation = useMutation({
    mutationFn: paymentTestingService.voidOrder,
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const refundMutation = useMutation({
    mutationFn: paymentTestingService.refund,
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const data = consoleQuery.data;
  const pending =
    retryMutation.isPending || voidMutation.isPending || refundMutation.isPending;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            Admin · PayPal only
          </p>
          <h2 className="mt-1 text-2xl font-bold text-foreground">Payment Testing Console</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Real PayPal sandbox and live captures from production data — no simulated
            transactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <EnvToggle environment={environment} onChange={setEnvironment} />
          <button
            type="button"
            onClick={invalidate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </header>

      {data?.gateways.length === 0 ? (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          <AlertTriangle className="mb-1 inline h-4 w-4" />
          No active PayPal gateway configured for {environment}. Add credentials in Payment
          Gateways with environment &quot;{environment}&quot;.
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      {consoleQuery.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : data ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <ChargesPanel
            title={environment === "sandbox" ? "Sandbox Charges" : "Live Charges"}
            subtitle="Successful PayPal captures"
            rows={data.recent_captures}
            pending={pending}
            onRetry={(row) =>
              retryMutation.mutate({
                attempt_id: row.source === "session_attempt" ? row.id : undefined,
                session_id: row.session_id ?? undefined,
                order_id: row.paypal_order_id ?? undefined,
              })
            }
            onVoid={(row) =>
              voidMutation.mutate({
                attempt_id: row.source === "session_attempt" ? row.id : undefined,
                order_id: row.paypal_order_id ?? undefined,
                session_id: row.session_id ?? undefined,
              })
            }
            onRefund={(row) =>
              refundMutation.mutate({
                transaction_id: row.transaction_id ?? undefined,
                capture_id: row.paypal_capture_id ?? undefined,
                attempt_id: row.source === "session_attempt" ? row.id : undefined,
                reason: "Admin testing console refund",
              })
            }
            onAudit={(row) =>
              setAuditTarget({
                resourceType:
                  row.source === "session_attempt" ? "payment_session_attempt" : "payment_transaction",
                resourceId: row.id,
                label: row.customer_name,
              })
            }
          />

          <Panel>
            <PanelHeader title="Recent Failures" subtitle="Failed attempts and transactions" />
            <FailureTable
              rows={data.recent_failures}
              pending={pending}
              onRetry={(row) =>
                row.source === "session_attempt" &&
                retryMutation.mutate({ attempt_id: row.id, order_id: row.paypal_order_id ?? undefined })
              }
              onAudit={(row) =>
                setAuditTarget({
                  resourceType:
                    row.source === "session_attempt" ? "payment_session_attempt" : "payment_transaction",
                  resourceId: row.id,
                  label: row.customer_name,
                })
              }
            />
          </Panel>

          <Panel className="xl:col-span-2">
            <PanelHeader title="Recent Refunds" subtitle="PayPal refund records" />
            <RefundTable rows={data.recent_refunds} />
          </Panel>
        </div>
      ) : null}

      {auditTarget ? (
        <Panel>
          <PanelHeader
            title="Audit trail"
            subtitle={auditTarget.label}
            right={
              <button
                type="button"
                onClick={() => setAuditTarget(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            }
          />
          <div className="p-4">
            {auditQuery.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : auditQuery.data?.length ? (
              <AuditTimeline
                logs={auditQuery.data.map((log) => ({
                  id: log.id,
                  action: log.action as import("@/types/payments-orchestration").AuditLogAction,
                  created_at: log.created_at,
                  user: log.user,
                  metadata: log.metadata,
                  user_id: log.user?.id ?? null,
                  resource_type: log.resource_type,
                  resource_id: log.resource_id,
                  ip_address: null,
                  request_method: null,
                  request_path: null,
                }))}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No audit events for this resource.</p>
            )}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

function EnvToggle({
  environment,
  onChange,
}: {
  environment: PayPalEnvironment;
  onChange: (env: PayPalEnvironment) => void;
}) {
  return (
    <div className="flex rounded-lg border border-border p-0.5">
      {(["sandbox", "live"] as const).map((env) => (
        <button
          key={env}
          type="button"
          onClick={() => onChange(env)}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition ${
            environment === env
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {env}
        </button>
      ))}
    </div>
  );
}

function ChargesPanel({
  title,
  subtitle,
  rows,
  pending,
  onRetry,
  onVoid,
  onRefund,
  onAudit,
}: {
  title: string;
  subtitle: string;
  rows: PaymentTestingCaptureRow[];
  pending: boolean;
  onRetry: (row: PaymentTestingCaptureRow) => void;
  onVoid: (row: PaymentTestingCaptureRow) => void;
  onRefund: (row: PaymentTestingCaptureRow) => void;
  onAudit: (row: PaymentTestingCaptureRow) => void;
}) {
  return (
    <Panel className="xl:col-span-2">
      <PanelHeader
        title={title}
        subtitle={subtitle}
        right={
          <Badge tone="neutral" className="gap-1">
            <FlaskConical className="h-3 w-3" />
            {rows.length} captures
          </Badge>
        }
      />
      {rows.length === 0 ? (
        <EmptyState title="No captures yet" description="Complete a real PayPal checkout to see captures here." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/60 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Booking</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Gateway</th>
                <th className="px-3 py-2">PayPal Order</th>
                <th className="px-3 py-2">PayPal Capture</th>
                <th className="px-3 py-2">Captured</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.source}-${row.id}`} className="border-b border-border/60 hover:bg-surface-2/30">
                  <td className="px-3 py-2 font-medium">{row.customer_name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.booking_id.slice(0, 8)}…</td>
                  <td className="px-3 py-2 tabular-nums font-semibold">
                    {formatMoney(row.amount, row.currency)}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{row.gateway_name}</td>
                  <td className="px-3 py-2 font-mono text-[11px]">{row.paypal_order_id ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-[11px]">{row.paypal_capture_id ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {formatDateTime(row.captured_at)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <ActionChip
                        label="Retry"
                        icon={RotateCcw}
                        disabled={pending || !row.paypal_order_id}
                        onClick={() => onRetry(row)}
                      />
                      <ActionChip
                        label="Void"
                        icon={Ban}
                        disabled={pending || !row.paypal_order_id}
                        onClick={() => onVoid(row)}
                      />
                      <ActionChip
                        label="Refund"
                        icon={Undo2}
                        disabled={pending || !row.paypal_capture_id}
                        onClick={() => onRefund(row)}
                      />
                      <ActionChip
                        label="Audit"
                        icon={ScrollText}
                        disabled={pending}
                        onClick={() => onAudit(row)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function FailureTable({
  rows,
  pending,
  onRetry,
  onAudit,
}: {
  rows: PaymentTestingFailureRow[];
  pending: boolean;
  onRetry: (row: PaymentTestingFailureRow) => void;
  onAudit: (row: PaymentTestingFailureRow) => void;
}) {
  if (!rows.length) {
    return <p className="p-6 text-sm text-muted-foreground">No recent failures.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {rows.map((row) => (
        <li key={`${row.source}-${row.id}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div>
            <p className="font-medium">{row.customer_name}</p>
            <p className="text-xs text-muted-foreground">
              {formatMoney(row.amount, row.currency)} · {row.gateway_name} · Order{" "}
              {row.paypal_order_id ?? "—"}
            </p>
            {row.failure_reason ? (
              <p className="mt-0.5 text-xs text-destructive">{row.failure_reason}</p>
            ) : null}
          </div>
          <div className="flex gap-1">
            {row.source === "session_attempt" && row.paypal_order_id ? (
              <ActionChip label="Retry" icon={RotateCcw} disabled={pending} onClick={() => onRetry(row)} />
            ) : null}
            <ActionChip label="Audit" icon={ScrollText} disabled={pending} onClick={() => onAudit(row)} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function RefundTable({ rows }: { rows: import("@/services/payment-testing.service").PaymentTestingRefundRow[] }) {
  if (!rows.length) {
    return <p className="p-6 text-sm text-muted-foreground">No recent refunds.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2">Customer</th>
            <th className="px-4 py-2">Capture ID</th>
            <th className="px-4 py-2">Refund ID</th>
            <th className="px-4 py-2">Amount</th>
            <th className="px-4 py-2">When</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border/60">
              <td className="px-4 py-2">{row.customer_name}</td>
              <td className="px-4 py-2 font-mono text-xs">{row.paypal_capture_id ?? "—"}</td>
              <td className="px-4 py-2 font-mono text-xs">{row.paypal_refund_id ?? "—"}</td>
              <td className="px-4 py-2 tabular-nums">{formatMoney(row.amount, row.currency)}</td>
              <td className="px-4 py-2 text-xs text-muted-foreground">{formatDateTime(row.refunded_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActionChip({
  label,
  icon: Icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: typeof RotateCcw;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={label}
      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-semibold hover:bg-accent disabled:opacity-40"
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}
