import { Badge, Panel, PanelHeader, Skeleton } from "@/components/app/primitives";
import { RecurringCustomerBadge } from "@/components/payments/recurring-customer-badge";
import { formatDateTime, formatMoney, statusTone } from "@/lib/payments/format";
import type { BookingPaymentRequestRow } from "@/types/payments-orchestration";
import { Inbox, Play } from "lucide-react";

type BookingQueuePanelProps = {
  requests: BookingPaymentRequestRow[];
  isLoading?: boolean;
  recurringByLeadId: Map<string, number>;
  selectedId: string | null;
  onSelect: (request: BookingPaymentRequestRow) => void;
  onProcess: (request: BookingPaymentRequestRow) => void;
  canProcess: boolean;
  isProcessingId: string | null;
};

export function BookingQueuePanel({
  requests,
  isLoading,
  recurringByLeadId,
  selectedId,
  onSelect,
  onProcess,
  canProcess,
  isProcessingId,
}: BookingQueuePanelProps) {
  const queue = requests.filter(
    (r) => r.status === "PENDING" || r.status === "PROCESSING" || r.booking.status === "PAYMENT_PENDING",
  );

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title="Booking payment queue"
        subtitle={`${queue.length} awaiting collection or capture`}
        right={
          <Badge tone="warning" className="hidden sm:inline-flex">
            Live queue
          </Badge>
        }
      />

      {isLoading ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !queue.length ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
          <Inbox className="h-6 w-6 opacity-50" />
          <p>Queue is clear — no pending booking payments.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-y-auto scrollbar-thin">
          {queue.map((request) => {
            const recurringCount = recurringByLeadId.get(request.booking.lead_id) ?? 1;
            const active = selectedId === request.id;
            return (
              <li key={request.id}>
                <button
                  type="button"
                  onClick={() => onSelect(request)}
                  className={`flex w-full flex-col gap-2 px-4 py-3 text-left transition hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between ${
                    active ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-foreground">
                        {request.booking.lead.customer_name}
                      </p>
                      <Badge tone={statusTone(request.status)}>{request.status}</Badge>
                      <RecurringCustomerBadge count={recurringCount} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatMoney(request.amount, request.currency)} · {request.gateway.name} ·{" "}
                      {formatDateTime(request.created_at)}
                    </p>
                  </div>
                  {canProcess ? (
                    <button
                      type="button"
                      disabled={isProcessingId === request.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onProcess(request);
                      }}
                      className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-45 sm:self-center"
                    >
                      <Play className="h-3.5 w-3.5" />
                      {isProcessingId === request.id ? "Processing…" : "Process"}
                    </button>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
