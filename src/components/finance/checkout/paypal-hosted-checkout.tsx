import { useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, Lock, ShieldCheck } from "lucide-react";
import { loadPayPalSdk } from "@/lib/payments/paypal-sdk";
import type { CheckoutPublicConfig } from "@/types/payments-orchestration";

export type PayPalCheckoutMode = "card-fields" | "smart-buttons" | "approve-link";

type PayPalHostedCheckoutProps = {
  config: CheckoutPublicConfig;
  orderId: string;
  approveUrl?: string | null;
  disabled?: boolean;
  onReady?: (mode: PayPalCheckoutMode) => void;
  onCardSubmitReady?: (submit: () => Promise<string | undefined>) => void;
  onApproved?: (orderId: string) => void;
  onError?: (message: string) => void;
};

export function PayPalHostedCheckout({
  config,
  orderId,
  approveUrl,
  disabled,
  onReady,
  onCardSubmitReady,
  onApproved,
  onError,
}: PayPalHostedCheckoutProps) {
  const buttonsHostRef = useRef<HTMLDivElement>(null);
  const cardButtonsHostRef = useRef<HTMLDivElement>(null);
  const buttonsInstanceRef = useRef<{ close: () => void } | null>(null);
  const cardButtonsInstanceRef = useRef<{ close: () => void } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<PayPalCheckoutMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cardFieldsReady, setCardFieldsReady] = useState(false);

  useEffect(() => {
    if (!orderId || !config.clientId || disabled) return;

    let cancelled = false;
    const fieldIds = {
      number: `paypal-card-number-${orderId.slice(0, 8)}`,
      name: `paypal-card-name-${orderId.slice(0, 8)}`,
      expiry: `paypal-card-expiry-${orderId.slice(0, 8)}`,
      cvv: `paypal-card-cvv-${orderId.slice(0, 8)}`,
    };

    async function mount() {
      setLoading(true);
      setError(null);
      setMode(null);
      setCardFieldsReady(false);
      buttonsInstanceRef.current?.close();
      cardButtonsInstanceRef.current?.close();

      try {
        const paypal = await loadPayPalSdk({
          clientId: config.clientId!,
          currency: config.currency,
          environment: config.environment,
          components: ["buttons", "card-fields"],
        });

        if (cancelled) return;

        const handleApprove = async (approvedOrderId: string) => {
          onApproved?.(approvedOrderId);
        };

        const handleSdkError = (err: unknown) => {
          const message = err instanceof Error ? err.message : "PayPal checkout failed";
          if (!cancelled) {
            setError(message);
            onError?.(message);
          }
        };

        if (paypal.CardFields) {
          const cardFields = paypal.CardFields({
            createOrder: () => orderId,
          });

          if (cardFields.isEligible()) {
            await cardFields.NumberField().render(`#${fieldIds.number}`);
            await cardFields.NameField().render(`#${fieldIds.name}`);
            await cardFields.ExpiryField().render(`#${fieldIds.expiry}`);
            await cardFields.CVVField().render(`#${fieldIds.cvv}`);

            if (cancelled) return;

            setMode("card-fields");
            setCardFieldsReady(true);
            onReady?.("card-fields");
            onCardSubmitReady?.(async () => {
              const result = await cardFields.submit();
              const submittedId = result.orderId ?? orderId;
              await handleApprove(submittedId);
              return submittedId;
            });
            return;
          }
        }

        if (paypal.Buttons && buttonsHostRef.current) {
          const buttonConfig = {
            style: { layout: "vertical", shape: "rect", height: 45 },
            createOrder: () => orderId,
            onApprove: async (data: { orderID: string }) => {
              await handleApprove(data.orderID);
            },
            onCancel: () => undefined,
            onError: handleSdkError,
          };

          buttonsInstanceRef.current = paypal.Buttons({
            ...buttonConfig,
            style: { ...buttonConfig.style, label: "paypal" },
          });
          await buttonsInstanceRef.current.render(buttonsHostRef.current);

          if (
            paypal.FUNDING?.CARD &&
            paypal.isFundingEligible?.(paypal.FUNDING.CARD) &&
            cardButtonsHostRef.current
          ) {
            cardButtonsInstanceRef.current = paypal.Buttons({
              ...buttonConfig,
              fundingSource: paypal.FUNDING.CARD,
              style: { ...buttonConfig.style, label: "pay" },
            });
            await cardButtonsInstanceRef.current.render(cardButtonsHostRef.current);
          }

          if (cancelled) return;

          setMode("smart-buttons");
          onReady?.("smart-buttons");
          return;
        }

        if (approveUrl) {
          setMode("approve-link");
          onReady?.("approve-link");
          return;
        }

        throw new Error(
          "PayPal checkout could not start. Use a sandbox business account or open hosted checkout.",
        );
      } catch (err) {
        if (approveUrl && !cancelled) {
          setMode("approve-link");
          onReady?.("approve-link");
          return;
        }
        const message = err instanceof Error ? err.message : "Failed to load PayPal checkout";
        if (!cancelled) {
          setError(message);
          onError?.(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void mount();

    return () => {
      cancelled = true;
      buttonsInstanceRef.current?.close();
      cardButtonsInstanceRef.current?.close();
    };
  }, [
    orderId,
    config.clientId,
    config.currency,
    config.environment,
    approveUrl,
    disabled,
    onApproved,
    onCardSubmitReady,
    onError,
    onReady,
  ]);

  const fieldPrefix = orderId.slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          {mode === "card-fields"
            ? "Enter card details in PayPal-hosted fields below, then click Process Payment."
            : mode === "smart-buttons"
              ? "Customer pays via PayPal — use Debit/Credit Card or PayPal wallet below."
              : "Open PayPal checkout in a new window for the customer to pay."}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading PayPal checkout…
        </div>
      ) : null}

      {error && mode !== "approve-link" ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {mode === "card-fields" ? (
        <div className={`space-y-3 ${loading ? "pointer-events-none opacity-40" : ""}`}>
          <FieldShell label="Card number" id={`paypal-card-number-${fieldPrefix}`} />
          <FieldShell label="Name on card" id={`paypal-card-name-${fieldPrefix}`} />
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldShell label="Expiry" id={`paypal-card-expiry-${fieldPrefix}`} />
            <FieldShell label="CVV" id={`paypal-card-cvv-${fieldPrefix}`} />
          </div>
          {cardFieldsReady ? (
            <div className="flex items-center gap-2 text-xs text-success">
              <Lock className="h-3.5 w-3.5" />
              Card fields ready — enter details and click Process Payment.
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        className={`space-y-3 ${mode === "smart-buttons" && !loading ? "" : "hidden"}`}
        aria-hidden={mode !== "smart-buttons"}
      >
        <div ref={buttonsHostRef} className="min-h-[45px]" />
        <div ref={cardButtonsHostRef} className="min-h-[45px]" />
        {mode === "smart-buttons" ? (
          <p className="text-xs text-muted-foreground">
            After the customer pays, this session captures automatically.
          </p>
        ) : null}
      </div>

      {mode === "approve-link" && approveUrl ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Inline card fields are not enabled on this PayPal app. Open hosted checkout:
          </p>
          <a
            href={approveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/15"
          >
            Open PayPal checkout
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      ) : null}
    </div>
  );
}

function FieldShell({ label, id }: { label: string; id: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div id={id} className="min-h-[44px] rounded-lg border border-border bg-surface px-3 py-2" />
    </div>
  );
}
