import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Panel, PanelHeader } from "@/components/app/primitives";
import { PayPalHostedCheckout, type PayPalCheckoutMode } from "@/components/finance/checkout/paypal-hosted-checkout";
import { formatMoney, statusTone } from "@/lib/payments/format";
import { paymentQueryKeys } from "@/lib/payments/query-keys";
import { paymentsOrchestrationService } from "@/services/payments-orchestration.service";
import type { PaymentSessionDetail, PaymentSessionStatus } from "@/types/payments-orchestration";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

function ActionButton({
  label,
  tone,
  disabled,
  loading,
  onClick,
}: {
  label: string;
  tone: "primary" | "success" | "danger" | "neutral";
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  const tones = {
    primary: "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15",
    success: "border-success/40 bg-success/10 text-success hover:bg-success/15",
    danger: "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15",
    neutral: "border-border bg-surface-2 text-foreground hover:bg-surface-2/80",
  };

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {label}
    </button>
  );
}

export function GatewayCheckoutPanel({
  sessionId,
  session,
  status,
  financeNotes,
  onFinanceNotesChange,
  onInvalidate,
}: {
  sessionId: string;
  session: PaymentSessionDetail;
  status: PaymentSessionStatus | undefined;
  financeNotes: string;
  onFinanceNotesChange: (value: string) => void;
  onInvalidate: () => void;
}) {
  const [orderId, setOrderId] = useState<string | null>(session.provider_order_id ?? null);
  const [approveUrl, setApproveUrl] = useState<string | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<PayPalCheckoutMode | null>(null);
  const [submitCardPayment, setSubmitCardPayment] = useState<(() => Promise<string | undefined>) | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const autoStartAttempted = useRef(false);
  const autoOrderAttempted = useRef(false);

  useEffect(() => {
    if (session.provider_order_id) {
      setOrderId(session.provider_order_id);
    }
  }, [session.provider_order_id]);

  const configQuery = useQuery({
    queryKey: paymentQueryKeys.checkoutConfig(sessionId),
    queryFn: () => paymentsOrchestrationService.getCheckoutConfig(sessionId),
    enabled: status === "PROCESSING" || status === "PENDING",
  });

  const startMutation = useMutation({
    mutationFn: () => paymentsOrchestrationService.startPaymentSession(sessionId),
    onSuccess: () => {
      setCheckoutError(null);
      onInvalidate();
    },
    onError: (err: Error) => {
      autoStartAttempted.current = false;
      setCheckoutError(err.message);
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: () => paymentsOrchestrationService.createCheckoutOrder(sessionId),
    onSuccess: (data) => {
      setOrderId(data.order_id);
      setApproveUrl(data.approve_url ?? null);
      setCheckoutError(null);
      onInvalidate();
    },
    onError: (err: Error) => {
      autoOrderAttempted.current = false;
      setCheckoutError(err.message);
    },
  });

  useEffect(() => {
    if (status !== "PENDING" || autoStartAttempted.current || startMutation.isPending) return;
    autoStartAttempted.current = true;
    startMutation.mutate();
  }, [status, startMutation]);

  useEffect(() => {
    const checkoutConfig = configQuery.data?.checkout;
    if (status !== "PROCESSING" || orderId || autoOrderAttempted.current || createOrderMutation.isPending) {
      return;
    }
    if (
      !configQuery.isSuccess ||
      !checkoutConfig?.supported
    ) {
      return;
    }
    autoOrderAttempted.current = true;
    createOrderMutation.mutate();
  }, [status, orderId, configQuery.isSuccess, configQuery.data?.checkout, createOrderMutation]);

  const captureMutation = useMutation({
    mutationFn: (payload: { order_id: string }) =>
      paymentsOrchestrationService.captureCheckoutOrder(sessionId, {
        order_id: payload.order_id,
        finance_notes: financeNotes || undefined,
      }),
    onSuccess: () => {
      setCheckoutError(null);
      onInvalidate();
    },
    onError: (err: Error) => setCheckoutError(err.message),
  });

  const recordFailureMutation = useMutation({
    mutationFn: (reason: string) =>
      paymentsOrchestrationService.recordCheckoutFailure(sessionId, {
        failure_reason: reason,
        order_id: orderId ?? undefined,
        finance_notes: financeNotes || undefined,
      }),
    onSuccess: () => {
      setOrderId(null);
      setSubmitCardPayment(null);
      onInvalidate();
    },
  });

  const saveNotesMutation = useMutation({
    mutationFn: () =>
      paymentsOrchestrationService.updateFinanceNotes(sessionId, financeNotes),
    onSuccess: onInvalidate,
  });

  const handlePayPalApproved = useCallback(
    async (approvedOrderId: string) => {
      setCheckoutError(null);
      try {
        await paymentsOrchestrationService.markCheckoutSubmitted(sessionId, approvedOrderId);
        captureMutation.mutate({ order_id: approvedOrderId });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Payment capture failed";
        setCheckoutError(message);
        recordFailureMutation.mutate(message);
      }
    },
    [sessionId, captureMutation, recordFailureMutation],
  );

  const handleReady = useCallback((submit: () => Promise<string | undefined>) => {
    setSubmitCardPayment(() => submit);
  }, []);

  const handleCheckoutReady = useCallback((mode: PayPalCheckoutMode) => {
    setCheckoutMode(mode);
    setCheckoutError(null);
  }, []);

  const processPayment = async () => {
    if (!submitCardPayment || !orderId) return;
    setCheckoutError(null);
    try {
      await submitCardPayment();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Card submission failed";
      setCheckoutError(message);
      recordFailureMutation.mutate(message);
    }
  };

  const checkout = configQuery.data?.checkout;
  const isBusy =
    startMutation.isPending ||
    createOrderMutation.isPending ||
    captureMutation.isPending ||
    recordFailureMutation.isPending;

  const loadingPayPalCheckout =
    status === "PROCESSING" &&
    Boolean(orderId) &&
    !checkoutMode &&
    !checkoutError;

  const isPreparingCheckout =
    status === "PENDING" ||
    startMutation.isPending ||
    createOrderMutation.isPending ||
    (status === "PROCESSING" && (!checkout?.supported || !orderId || loadingPayPalCheckout));

  return (
    <Panel className="sticky top-4 h-fit">
      <PanelHeader title="Gateway Checkout" subtitle="Finance-only assisted payment processing" />
      <div className="space-y-3 p-4">
        <div className="rounded-lg border border-border bg-surface-2/40 px-3 py-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Gateway</span>
            <span className="font-semibold text-foreground">{session.gateway.name}</span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold tabular-nums">
              {formatMoney(session.amount, session.currency)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Finance notes
          </label>
          <textarea
            value={financeNotes}
            onChange={(e) => onFinanceNotesChange(e.target.value)}
            rows={3}
            placeholder="Internal notes for finance team…"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
          <ActionButton
            label="Save notes"
            tone="neutral"
            disabled={saveNotesMutation.isPending}
            loading={saveNotesMutation.isPending}
            onClick={() => saveNotesMutation.mutate()}
          />
        </div>

        {isPreparingCheckout ? (
          <div className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
            {status === "PENDING"
              ? "Starting PayPal checkout session…"
              : !orderId
                ? "Creating PayPal order…"
                : "Opening PayPal checkout…"}
          </div>
        ) : null}

        {status === "PENDING" && !autoStartAttempted.current ? (
          <ActionButton
            label="Begin Checkout"
            tone="primary"
            disabled={isBusy}
            loading={startMutation.isPending}
            onClick={() => {
              autoStartAttempted.current = true;
              startMutation.mutate();
            }}
          />
        ) : null}

        {status === "PROCESSING" && checkout?.supported ? (
          <>
            {!orderId ? (
              <ActionButton
                label="Create PayPal Order"
                tone="primary"
                disabled={isBusy || configQuery.isLoading}
                loading={createOrderMutation.isPending}
                onClick={() => createOrderMutation.mutate()}
              />
            ) : (
              <>
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs">
                  <span className="text-muted-foreground">PayPal Order</span>
                  <code className="font-mono text-foreground">{orderId.slice(0, 16)}…</code>
                </div>
                <PayPalHostedCheckout
                  config={checkout}
                  orderId={orderId}
                  approveUrl={approveUrl}
                  disabled={captureMutation.isPending}
                  onReady={handleCheckoutReady}
                  onCardSubmitReady={handleReady}
                  onApproved={(id) => void handlePayPalApproved(id)}
                  onError={(message) => setCheckoutError(message)}
                />
                {checkoutMode === "card-fields" ? (
                  <ActionButton
                    label="Process Payment"
                    tone="success"
                    disabled={!submitCardPayment || isBusy}
                    loading={captureMutation.isPending}
                    onClick={() => void processPayment()}
                  />
                ) : null}
                <ActionButton
                  label="New attempt"
                  tone="neutral"
                  disabled={isBusy}
                  loading={createOrderMutation.isPending}
                  onClick={() => {
                    setOrderId(null);
                    setApproveUrl(null);
                    setCheckoutMode(null);
                    setSubmitCardPayment(null);
                    autoOrderAttempted.current = false;
                    createOrderMutation.mutate();
                  }}
                />
              </>
            )}
          </>
        ) : null}

        {status === "PROCESSING" && checkout && !checkout.supported ? (
          <div className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">
            <AlertTriangle className="mb-1 inline h-4 w-4" />
            {checkout.message ?? "This gateway checkout is not yet available."}
          </div>
        ) : null}

        {checkoutError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {checkoutError}
          </div>
        ) : null}

        {status === "SUCCESS" ? (
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" />
            Payment captured — booking confirmed.
          </div>
        ) : null}

        {status === "FAILED" ? (
          <ActionButton
            label="Retry — reset to processing"
            tone="primary"
            disabled={isBusy}
            onClick={() => startMutation.mutate()}
          />
        ) : null}

        <ActionButton
          label="Cancel Session"
          tone="neutral"
          disabled={status === "SUCCESS" || status === "CANCELLED" || isBusy}
          onClick={() => paymentsOrchestrationService.cancelPaymentSession(sessionId).then(onInvalidate)}
        />
      </div>
    </Panel>
  );
}
