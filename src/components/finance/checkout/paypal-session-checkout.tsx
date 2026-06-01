import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import {
  PayPalHostedCheckout,
  type PayPalCheckoutMode,
} from "@/components/finance/checkout/paypal-hosted-checkout";
import { formatMoney } from "@/lib/payments/format";
import { formatPayPalClientError, preloadPayPalSdk } from "@/lib/payments/paypal-sdk";
import { paymentQueryKeys } from "@/lib/payments/query-keys";
import { paymentsOrchestrationService } from "@/services/payments-orchestration.service";
import type {
  CheckoutPrepareResponse,
  CheckoutPublicConfig,
  PaymentSessionDetail,
} from "@/types/payments-orchestration";

type PayPalSessionCheckoutProps = {
  sessionId: string;
  /** When omitted, PayPal order is created via prepareCheckout (faster quick-collect). */
  prepare?: CheckoutPrepareResponse | null;
  checkout?: CheckoutPublicConfig;
  session?: PaymentSessionDetail;
  customerLabel?: string;
  onSuccess?: (session: PaymentSessionDetail) => void;
  onOpenFullConsole?: () => void;
};

export function PayPalSessionCheckout({
  sessionId,
  prepare: initialPrepare,
  checkout: initialCheckout,
  session,
  customerLabel,
  onSuccess,
  onOpenFullConsole,
}: PayPalSessionCheckoutProps) {
  const queryClient = useQueryClient();
  const sdkPreloaded = useRef(false);

  const prepareQuery = useQuery({
    queryKey: paymentQueryKeys.checkoutPrepare(sessionId),
    queryFn: () => paymentsOrchestrationService.prepareCheckout(sessionId),
    enabled: !initialPrepare,
    staleTime: 60_000,
    retry: 1,
  });

  const prepare = initialPrepare ?? prepareQuery.data ?? null;
  const checkout = prepare?.checkout ?? initialCheckout;

  const [orderId, setOrderId] = useState<string | null>(null);
  const [approveUrl, setApproveUrl] = useState<string | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<PayPalCheckoutMode | null>(null);
  const [submitCardPayment, setSubmitCardPayment] = useState<
    (() => Promise<string | undefined>) | null
  >(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!prepare) return;
    const resolvedOrderId = prepare.order?.order_id ?? prepare.session.provider_order_id ?? null;
    setOrderId(resolvedOrderId);
    setApproveUrl(prepare.order?.approve_url ?? null);
    queryClient.setQueryData(paymentQueryKeys.checkoutPrepare(sessionId), prepare);
  }, [prepare, queryClient, sessionId]);

  const amount = prepare?.session.amount ?? Number(session?.amount ?? 0);
  const currency = prepare?.session.currency ?? session?.currency ?? "USD";

  useEffect(() => {
    if (!checkout?.clientId || !checkout.supported || sdkPreloaded.current) return;
    sdkPreloaded.current = true;
    preloadPayPalSdk({
      clientId: checkout.clientId,
      currency: checkout.currency,
      environment: checkout.environment,
    });
  }, [checkout]);

  const captureMutation = useMutation({
    mutationFn: (payload: { order_id: string }) =>
      paymentsOrchestrationService.captureCheckoutOrder(sessionId, {
        order_id: payload.order_id,
      }),
    onSuccess: (updatedSession) => {
      setCheckoutError(null);
      setPaid(true);
      queryClient.setQueryData(paymentQueryKeys.paymentSessionDetail(sessionId), updatedSession);
      onSuccess?.(updatedSession);
    },
    onError: (err: Error) => setCheckoutError(err.message),
  });

  const recordFailureMutation = useMutation({
    mutationFn: (reason: string) =>
      paymentsOrchestrationService.recordCheckoutFailure(sessionId, {
        failure_reason: reason,
        order_id: orderId ?? undefined,
      }),
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

  const processPayment = async () => {
    if (!submitCardPayment) return;
    setCheckoutError(null);
    try {
      await submitCardPayment();
    } catch (err) {
      const message = formatPayPalClientError(err);
      setCheckoutError(message);
      recordFailureMutation.mutate(message);
    }
  };

  const isBusy = captureMutation.isPending || recordFailureMutation.isPending;
  const preparingPayPal = !prepare && (prepareQuery.isLoading || prepareQuery.isFetching);
  const prepareFailed =
    !prepare && prepareQuery.isError && !prepareQuery.isFetching;

  if (paid) {
    return (
      <div className="space-y-4 py-2">
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-3 text-sm text-success">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          Payment captured successfully.
        </div>
        {onOpenFullConsole ? (
          <button
            type="button"
            onClick={onOpenFullConsole}
            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-2"
          >
            Open full checkout console
          </button>
        ) : null}
      </div>
    );
  }

  if (!checkout?.supported) {
    return (
      <p className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">
        {checkout?.message ?? "PayPal checkout is not available for this gateway."}
      </p>
    );
  }

  if (prepareFailed) {
    return (
      <div className="space-y-2">
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {prepareQuery.error instanceof Error
            ? prepareQuery.error.message
            : "Could not start PayPal checkout."}
        </p>
        <button
          type="button"
          onClick={() => void prepareQuery.refetch()}
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface-2/50 px-3 py-2 text-sm">
        {customerLabel ? (
          <p className="font-medium text-foreground">{customerLabel}</p>
        ) : null}
        <p className="tabular-nums text-muted-foreground">
          {formatMoney(amount, currency)}
          {session?.gateway.name ? ` · ${session.gateway.name}` : null}
        </p>
      </div>

      {preparingPayPal || !orderId ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Connecting to PayPal…
        </div>
      ) : (
        <>
          <PayPalHostedCheckout
            config={checkout}
            orderId={orderId}
            approveUrl={approveUrl}
            disabled={isBusy}
            onReady={(mode) => {
              setCheckoutMode(mode);
              setCheckoutError(null);
              if (mode === "approve-link" && approveUrl) {
                window.open(approveUrl, "_blank", "noopener,noreferrer");
              }
            }}
            onCardSubmitReady={(submit) => setSubmitCardPayment(() => submit)}
            onApproved={(id) => void handlePayPalApproved(id)}
            onError={(message) => setCheckoutError(message)}
          />

          {checkoutMode === "card-fields" ? (
            <button
              type="button"
              disabled={!submitCardPayment || isBusy}
              onClick={() => void processPayment()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {captureMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Process Payment
            </button>
          ) : null}

          {checkoutMode === "approve-link" && approveUrl ? (
            <a
              href={approveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary"
            >
              Open PayPal checkout
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </>
      )}

      {checkoutError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {checkoutError}
        </p>
      ) : null}

      {onOpenFullConsole ? (
        <button
          type="button"
          onClick={onOpenFullConsole}
          className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Need booking details? Open full console
        </button>
      ) : null}
    </div>
  );
}
