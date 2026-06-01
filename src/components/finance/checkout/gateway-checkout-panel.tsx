import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Panel, PanelHeader } from "@/components/app/primitives";
import { PayPalHostedCheckout, type PayPalCheckoutMode } from "@/components/finance/checkout/paypal-hosted-checkout";
import { formatMoney } from "@/lib/payments/format";
import { paymentQueryKeys } from "@/lib/payments/query-keys";
import { formatPayPalClientError, preloadPayPalSdk } from "@/lib/payments/paypal-sdk";
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
  const queryClient = useQueryClient();
  const [orderId, setOrderId] = useState<string | null>(session.provider_order_id ?? null);
  const [approveUrl, setApproveUrl] = useState<string | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<PayPalCheckoutMode | null>(null);
  const [submitCardPayment, setSubmitCardPayment] = useState<(() => Promise<string | undefined>) | null>(
    null,
  );
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const sdkPreloaded = useRef(false);

  useEffect(() => {
    if (session.provider_order_id) {
      setOrderId(session.provider_order_id);
    }
  }, [session.provider_order_id]);

  const canPrepare =
    status === "PENDING" || status === "PROCESSING" || status === "FAILED";

  const prepareQuery = useQuery({
    queryKey: paymentQueryKeys.checkoutPrepare(sessionId),
    queryFn: () => paymentsOrchestrationService.prepareCheckout(sessionId),
    enabled: canPrepare,
    staleTime: 60_000,
    retry: 1,
    initialData: () =>
      queryClient.getQueryData(paymentQueryKeys.checkoutPrepare(sessionId)),
    refetchOnMount: (query) => (query.state.data?.order?.order_id ? false : "always"),
  });

  useEffect(() => {
    if (!prepareQuery.data) return;

    const { checkout, order, session: preparedSession } = prepareQuery.data;

    if (checkout.clientId && checkout.supported && !sdkPreloaded.current) {
      sdkPreloaded.current = true;
      preloadPayPalSdk({
        clientId: checkout.clientId,
        currency: checkout.currency,
        environment: checkout.environment,
      });
    }

    const resolvedOrderId = order?.order_id ?? preparedSession.provider_order_id ?? null;
    if (resolvedOrderId) {
      setOrderId(resolvedOrderId);
      setApproveUrl(order?.approve_url ?? null);
    }

    queryClient.setQueryData(paymentQueryKeys.paymentSessionDetail(sessionId), (current) => {
      if (!current) return current;
      return {
        ...current,
        status: preparedSession.status,
        provider_order_id: resolvedOrderId,
      };
    });
  }, [prepareQuery.data, queryClient, sessionId]);

  const captureMutation = useMutation({
    mutationFn: (payload: { order_id: string }) =>
      paymentsOrchestrationService.captureCheckoutOrder(sessionId, {
        order_id: payload.order_id,
        finance_notes: financeNotes || undefined,
      }),
    onSuccess: (updatedSession) => {
      setCheckoutError(null);
      queryClient.setQueryData(paymentQueryKeys.paymentSessionDetail(sessionId), updatedSession);
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
      setCheckoutMode(null);
      void prepareQuery.refetch();
      onInvalidate();
    },
  });

  const saveNotesMutation = useMutation({
    mutationFn: () => paymentsOrchestrationService.updateFinanceNotes(sessionId, financeNotes),
    onSuccess: onInvalidate,
  });

  const retryPrepare = useCallback(() => {
    setCheckoutError(null);
    setCheckoutMode(null);
    setOrderId(null);
    setApproveUrl(null);
    sdkPreloaded.current = false;
    void prepareQuery.refetch();
  }, [prepareQuery]);

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
      const message = formatPayPalClientError(err);
      setCheckoutError(message);
      recordFailureMutation.mutate(message);
    }
  };

  const checkout = prepareQuery.data?.checkout;
  const effectiveStatus = prepareQuery.data?.session.status ?? status;
  const isBusy =
    prepareQuery.isFetching ||
    captureMutation.isPending ||
    recordFailureMutation.isPending;

  const hasPreparedCheckout = Boolean(
    prepareQuery.data?.order?.order_id ??
      prepareQuery.data?.session.provider_order_id ??
      orderId,
  );

  const loadingPayPalCheckout =
    effectiveStatus === "PROCESSING" &&
    hasPreparedCheckout &&
    !checkoutMode &&
    !checkoutError &&
    !prepareQuery.isError;

  const isPreparingCheckout =
    canPrepare &&
    !hasPreparedCheckout &&
    (prepareQuery.isLoading || prepareQuery.isFetching);

  const prepareError =
    checkoutError ??
    (prepareQuery.error instanceof Error ? prepareQuery.error.message : null);

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
            {prepareQuery.isLoading || prepareQuery.isFetching
              ? "Preparing PayPal checkout…"
              : "Opening PayPal card fields…"}
          </div>
        ) : null}

        {effectiveStatus === "PROCESSING" && checkout?.supported && hasPreparedCheckout ? (
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
              onClick={retryPrepare}
            />
          </>
        ) : null}

        {effectiveStatus === "PROCESSING" && checkout && !checkout.supported ? (
          <div className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">
            <AlertTriangle className="mb-1 inline h-4 w-4" />
            {checkout.message ?? "This gateway checkout is not yet available."}
          </div>
        ) : null}

        {prepareError ? (
          <div className="space-y-2">
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {prepareError}
            </div>
            <ActionButton label="Retry checkout" tone="primary" disabled={isBusy} onClick={retryPrepare} />
          </div>
        ) : null}

        {effectiveStatus === "SUCCESS" ? (
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" />
            Payment captured — booking confirmed.
          </div>
        ) : null}

        {effectiveStatus === "FAILED" ? (
          <ActionButton label="Retry checkout" tone="primary" disabled={isBusy} onClick={retryPrepare} />
        ) : null}

        <ActionButton
          label="Cancel Session"
          tone="neutral"
          disabled={effectiveStatus === "SUCCESS" || effectiveStatus === "CANCELLED" || isBusy}
          onClick={() => paymentsOrchestrationService.cancelPaymentSession(sessionId).then(onInvalidate)}
        />
      </div>
    </Panel>
  );
}
