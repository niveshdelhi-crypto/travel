import { Badge, Skeleton } from "@/components/app/primitives";
import { formatDateTime, statusTone } from "@/lib/payments/format";
import type { PaymentSessionAttemptRow } from "@/types/payments-orchestration";
import { History } from "lucide-react";

export function PaymentAttemptHistory({
  attempts,
  loading,
}: {
  attempts: PaymentSessionAttemptRow[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!attempts.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
        <History className="h-5 w-5 opacity-60" />
        <p>No payment attempts yet.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {attempts.map((attempt) => (
        <div key={attempt.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                Attempt #{attempt.attempt_number}
              </span>
              <Badge tone={statusTone(attempt.status)}>{attempt.status}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDateTime(attempt.created_at)}
              {attempt.initiated_by ? ` · ${attempt.initiated_by.name}` : ""}
            </p>
            {attempt.provider_order_id ? (
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                Order {attempt.provider_order_id.slice(0, 20)}…
              </p>
            ) : null}
            {attempt.failure_reason ? (
              <p className="mt-1 text-xs text-destructive">{attempt.failure_reason}</p>
            ) : null}
          </div>
          <div className="text-right text-xs text-muted-foreground">
            {attempt.gateway.name}
          </div>
        </div>
      ))}
    </div>
  );
}
