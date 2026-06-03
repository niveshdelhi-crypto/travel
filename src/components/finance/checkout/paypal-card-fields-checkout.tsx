import { useEffect, useRef, useState } from "react";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { loadPayPalCardFieldsSdk, type PayPalCardFieldsInstance } from "@/lib/payments/paypal-sdk";
import type { CheckoutPublicConfig } from "@/types/payments-orchestration";

export function PayPalCardFieldsCheckout({
  config,
  orderId,
  disabled,
  onReady,
  onError,
}: {
  config: CheckoutPublicConfig;
  orderId: string | null;
  disabled?: boolean;
  onReady?: (submit: () => Promise<string | undefined>) => void;
  onError?: (message: string) => void;
}) {
  const cardFieldsRef = useRef<PayPalCardFieldsInstance | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || !config.clientId || disabled) return;

    let cancelled = false;

    async function mount() {
      setLoading(true);
      setError(null);
      setReady(false);

      try {
        const paypal = await loadPayPalCardFieldsSdk({
          clientId: config.clientId!,
          currency: config.currency,
          environment: config.environment,
        });

        if (cancelled) return;

        if (!paypal.CardFields) {
          throw new Error("PayPal Card Fields are not available for this merchant account");
        }

        const cardFields = paypal.CardFields({
          createOrder: () => orderId!,
        });

        if (!cardFields.isEligible()) {
          throw new Error("PayPal Card Fields are not eligible for this session");
        }

        await cardFields.NumberField().render("#paypal-card-number");
        await cardFields.NameField().render("#paypal-card-name");
        await cardFields.ExpiryField().render("#paypal-card-expiry");
        await cardFields.CVVField().render("#paypal-card-cvv");

        if (cancelled) return;

        cardFieldsRef.current = cardFields;
        setReady(true);

        onReady?.(async () => {
          const result = await cardFields.submit();
          return result.orderId ?? orderId ?? undefined;
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load PayPal card fields";
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
      cardFieldsRef.current = null;
    };
  }, [orderId, config.clientId, config.currency, config.environment, disabled, onError, onReady]);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          Card details are entered in PayPal-hosted fields. Card numbers, CVV, and expiry never
          touch MarkleTravelBooking servers, databases, or logs.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading secure card fields…
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className={`space-y-3 ${!orderId || loading ? "pointer-events-none opacity-40" : ""}`}>
        <FieldShell label="Card number" id="paypal-card-number" />
        <FieldShell label="Name on card" id="paypal-card-name" />
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldShell label="Expiry" id="paypal-card-expiry" />
          <FieldShell label="CVV" id="paypal-card-cvv" />
        </div>
      </div>

      {ready ? (
        <div className="flex items-center gap-2 text-xs text-success">
          <Lock className="h-3.5 w-3.5" />
          PayPal hosted fields ready — submit payment when card details are entered.
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
      <div
        id={id}
        className="min-h-[44px] rounded-lg border border-border bg-surface px-3 py-2"
      />
    </div>
  );
}
