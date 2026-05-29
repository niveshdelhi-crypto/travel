import { Badge, Skeleton } from "@/components/app/primitives";
import { formatDateTime } from "@/lib/payments/format";
import type { AuditLogRow } from "@/types/payments-orchestration";
import {
  CheckCircle2,
  Clock,
  FileText,
  RefreshCw,
  Shield,
  XCircle,
} from "lucide-react";

function actionIcon(action: AuditLogRow["action"]) {
  switch (action) {
    case "PAYMENT_SUCCESS":
    case "BOOKING_CONFIRMED":
      return CheckCircle2;
    case "PAYMENT_FAILED":
      return XCircle;
    case "PAYMENT_PROCESSING":
    case "PAYMENT_REQUEST_CREATED":
      return RefreshCw;
    case "PAYMENT_REFUNDED":
      return RefreshCw;
    case "PAYMENT_GATEWAY_CREATED":
    case "PAYMENT_GATEWAY_UPDATED":
    case "PAYMENT_GATEWAY_DEACTIVATED":
      return Shield;
    default:
      return FileText;
  }
}

function actionTone(action: AuditLogRow["action"]) {
  switch (action) {
    case "PAYMENT_SUCCESS":
    case "BOOKING_CONFIRMED":
      return "success" as const;
    case "PAYMENT_FAILED":
      return "danger" as const;
    case "PAYMENT_PROCESSING":
      return "info" as const;
    case "PAYMENT_REFUNDED":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

function formatAction(action: AuditLogRow["action"]) {
  return action.replaceAll("_", " ").toLowerCase();
}

export function AuditTimeline({
  logs,
  isLoading,
}: {
  logs: AuditLogRow[];
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!logs.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
        <Clock className="h-5 w-5 opacity-60" />
        <p>No audit events recorded yet.</p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-0 px-4 py-3">
      {logs.map((log, index) => {
        const Icon = actionIcon(log.action);
        const tone = actionTone(log.action);
        return (
          <li key={log.id} className="relative flex gap-3 pb-6 last:pb-2">
            {index < logs.length - 1 ? (
              <span
                className="absolute left-[13px] top-7 h-[calc(100%-12px)] w-px bg-border"
                aria-hidden
              />
            ) : null}
            <span className="relative z-10 mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border bg-surface-2">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={tone}>{formatAction(log.action)}</Badge>
                <span className="text-xs text-muted-foreground">{formatDateTime(log.created_at)}</span>
              </div>
              <p className="mt-1 text-sm text-foreground">
                {log.user?.name ?? "System"}
                {log.resource_type ? (
                  <span className="text-muted-foreground">
                    {" "}
                    · {log.resource_type.replaceAll("_", " ")}
                  </span>
                ) : null}
              </p>
              {log.request_path ? (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {log.request_method} {log.request_path}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
