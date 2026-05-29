import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/app/primitives";
import { GatewaySelector } from "@/components/payments/gateway-selector";
import { formatDateTime, formatMoney, statusTone } from "@/lib/payments/format";
import { canProcessPayments } from "@/lib/payments/customer-visibility";
import type { GatewayOption } from "@/lib/payments/gateway-labels";
import type { PaymentTransactionRow } from "@/types/payments-orchestration";
import type { UserRole } from "@/types";
import { AlertTriangle, CircleDollarSign, Play, RotateCcw } from "lucide-react";

type TransactionProcessModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: PaymentTransactionRow | null;
  gatewayOptions: GatewayOption[];
  selectedGatewayId: string;
  onGatewayChange: (id: string) => void;
  role: UserRole;
  isProcessing: boolean;
  onProcess: () => void;
  onCapture: () => void;
  onRefund: () => void;
};

export function TransactionProcessModal({
  open,
  onOpenChange,
  transaction,
  gatewayOptions,
  selectedGatewayId,
  onGatewayChange,
  role,
  isProcessing,
  onProcess,
  onCapture,
  onRefund,
}: TransactionProcessModalProps) {
  const canProcess = canProcessPayments(role);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border bg-surface sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Process payment transaction</DialogTitle>
          <DialogDescription>
            Review gateway routing and advance the transaction through the orchestration lifecycle.
          </DialogDescription>
        </DialogHeader>

        {!transaction ? (
          <p className="text-sm text-muted-foreground">No transaction selected.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 rounded-xl border border-border bg-surface-2/50 p-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Traveler</p>
                <p className="font-medium text-foreground">
                  {transaction.booking.lead.customer_name}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Amount</p>
                <p className="font-semibold tabular-nums text-foreground">
                  {formatMoney(transaction.amount, transaction.currency)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Status</p>
                <Badge tone={statusTone(transaction.status)}>{transaction.status}</Badge>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Created</p>
                <p className="text-sm text-foreground">{formatDateTime(transaction.created_at)}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Payment gateway</p>
              <GatewaySelector
                options={gatewayOptions}
                value={selectedGatewayId || transaction.gateway_id}
                onChange={onGatewayChange}
                disabled={!canProcess}
              />
            </div>

            {transaction.failure_reason ? (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {transaction.failure_reason}
              </div>
            ) : null}

            {transaction.provider_reference ? (
              <p className="text-xs text-muted-foreground">
                Provider ref:{" "}
                <span className="font-mono text-foreground">{transaction.provider_reference}</span>
              </p>
            ) : null}
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          {!canProcess ? (
            <p className="mr-auto text-xs text-muted-foreground">
              Processing actions require admin or finance admin role.
            </p>
          ) : null}
          <button
            type="button"
            disabled={!transaction || !canProcess || isProcessing || transaction?.status !== "PENDING"}
            onClick={onProcess}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-45"
          >
            <Play className="h-4 w-4" />
            Process
          </button>
          <button
            type="button"
            disabled={
              !transaction ||
              !canProcess ||
              isProcessing ||
              transaction?.status !== "PROCESSING" ||
              !transaction?.provider_reference
            }
            onClick={onCapture}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium disabled:opacity-45"
          >
            <CircleDollarSign className="h-4 w-4" />
            Capture
          </button>
          <button
            type="button"
            disabled={!transaction || !canProcess || isProcessing || transaction?.status !== "SUCCESS"}
            onClick={onRefund}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive disabled:opacity-45"
          >
            <RotateCcw className="h-4 w-4" />
            Refund
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
