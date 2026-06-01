import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { paymentsOrchestrationService } from "@/services/payments-orchestration.service";

type QuickCollectPaymentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function QuickCollectPaymentModal({ open, onOpenChange }: QuickCollectPaymentModalProps) {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState("");
  const [amount, setAmount] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const collectMutation = useMutation({
    mutationFn: () => {
      const parsedAmount = Number.parseFloat(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Enter a valid amount greater than zero.");
      }
      return paymentsOrchestrationService.quickCollectPayment({
        customer_name: customerName.trim(),
        amount: parsedAmount,
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim(),
        currency: "USD",
      });
    },
    onSuccess: async (result) => {
      setError(null);
      onOpenChange(false);
      setCustomerName("");
      setAmount("");
      setCustomerEmail("");
      setCustomerPhone("");
      await navigate({
        to: "/app/checkout-console/$sessionId",
        params: { sessionId: result.session_id },
      });
    },
    onError: (err: Error) => {
      setError(err.message || "Unable to start checkout. Try again.");
    },
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    collectMutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-surface">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Quick card collection
          </DialogTitle>
          <DialogDescription>
            Enter customer details and amount. You will be taken to PayPal checkout to collect payment
            by card.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-foreground">Customer name</span>
            <input
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-foreground outline-none focus:border-primary/50"
              placeholder="John Smith"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-foreground">Amount to receive (USD)</span>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-foreground outline-none focus:border-primary/50"
              placeholder="199.00"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-foreground">Email</span>
            <input
              required
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-foreground outline-none focus:border-primary/50"
              placeholder="customer@example.com"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-foreground">Phone number</span>
            <input
              required
              type="tel"
              minLength={7}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-foreground outline-none focus:border-primary/50"
              placeholder="+1 213 555 0147"
            />
          </label>

          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={collectMutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {collectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              Open PayPal checkout
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
