import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { telephonyService, type CallRecord } from "@/services";
import { CallStatusBadge } from "./CallStatusBadge";

export function CallHistoryPanel() {
  const historyQuery = useQuery({
    queryKey: ["calls", "history", { page: 1, pageSize: 12 }],
    queryFn: () => telephonyService.list({ page: 1, pageSize: 12 }),
    refetchInterval: 30_000,
  });

  const rows = historyQuery.data?.data ?? [];

  return (
    <div className="border-t border-border bg-surface/60 px-4 py-3 md:px-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recent calls
        </h3>
        <span className="text-xs text-muted-foreground">
          {historyQuery.isFetching ? "Updating…" : `${historyQuery.data?.total ?? 0} total`}
        </span>
      </div>

      {historyQuery.isError ? (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Unable to load call history.
        </p>
      ) : historyQuery.isLoading ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 w-48 shrink-0 animate-pulse rounded-lg bg-surface-2" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No calls yet. Start an outbound call from the dial pad or a lead in the queue.
        </p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {rows.map((call) => (
            <HistoryCard key={call.id} call={call} />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryCard({ call }: { call: CallRecord }) {
  const label =
    call.lead?.customer_name ??
    (call.direction === "OUTBOUND" ? call.to_number : call.from_number);

  return (
    <div className="w-52 shrink-0 rounded-lg border border-border bg-surface-2 p-3">
      <p className="truncate text-sm font-medium text-foreground">{label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {call.direction} · {formatWhen(call.created_at)}
      </p>
      <div className="mt-2">
        <CallStatusBadge status={call.status} />
      </div>
      {call.failure_reason ? (
        <p className="mt-1 line-clamp-2 text-[10px] text-destructive">{call.failure_reason}</p>
      ) : null}
    </div>
  );
}

function formatWhen(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
