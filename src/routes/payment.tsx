import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Lock,
  Shield,
  Smartphone,
  Wallet,
} from "lucide-react";

export const Route = createFileRoute("/payment")({
  head: () => ({
    meta: [
      { title: "Secure payment — FleetNexus" },
      { name: "description", content: "Complete your car rental payment securely." },
    ],
  }),
  component: PaymentPage,
});

const steps = [
  { id: 1, label: "Your details",  done: true },
  { id: 2, label: "Add-ons",       done: true },
  { id: 3, label: "Payment",       active: true },
  { id: 4, label: "Confirm" },
];

const PAYMENT_METHODS = [
  { id: "card",   label: "Credit / debit card", icon: CreditCard,  description: "Visa, Mastercard, Amex" },
  { id: "apple",  label: "Apple Pay",            icon: Smartphone,  description: "Face ID or Touch ID" },
  { id: "paypal", label: "PayPal",               icon: Wallet,      description: "Pay with your PayPal balance" },
];

function PaymentPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="pt-20">
        {/* Progress stepper */}
        <div className="border-b border-border bg-surface/40">
          <div className="mx-auto max-w-4xl px-6 py-4">
            <div className="flex items-center gap-0">
              {steps.map((step, i) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition ${
                        step.done
                          ? "bg-success text-white"
                          : step.active
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-surface text-muted-foreground"
                      }`}
                    >
                      {step.done ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        step.active ? "text-foreground" : step.done ? "text-success" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && <div className="mx-3 h-px w-10 bg-border" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-10 lg:grid-cols-5">
          {/* Left — payment form */}
          <div className="space-y-6 lg:col-span-3">

            {/* Method selector */}
            <section className="rounded-xl border border-border bg-surface">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold text-foreground">Payment method</h2>
              </div>
              <div className="space-y-2 p-5">
                {PAYMENT_METHODS.map((m, i) => (
                  <label
                    key={m.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 transition ${
                      i === 0
                        ? "border-primary bg-primary/5"
                        : "border-border bg-surface-2 hover:border-border-strong"
                    }`}
                  >
                    <input type="radio" name="payment" defaultChecked={i === 0} className="accent-primary" />
                    <div className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface">
                      <m.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{m.label}</div>
                      <div className="text-xs text-muted-foreground">{m.description}</div>
                    </div>
                    {i === 0 && (
                      <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Selected
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </section>

            {/* Card details */}
            <section className="rounded-xl border border-border bg-surface">
              <div className="border-b border-border px-5 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">Card details</h2>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3 text-success" />
                    256-bit SSL encrypted
                  </div>
                </div>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Card number
                  </label>
                  <div className="relative">
                    <input
                      placeholder="1234  5678  9012  3456"
                      className="h-11 w-full rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-border-strong focus:outline-none pr-10"
                    />
                    <CreditCard className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Cardholder name
                  </label>
                  <input
                    placeholder="John Smith"
                    className="h-11 w-full rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-border-strong focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Expiry date
                    </label>
                    <input
                      placeholder="MM / YY"
                      className="h-11 w-full rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-border-strong focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      CVV
                    </label>
                    <input
                      placeholder="•••"
                      className="h-11 w-full rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-border-strong focus:outline-none"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" className="accent-primary" />
                  Save this card for future bookings
                </label>
              </div>
            </section>

            {/* Billing address */}
            <section className="rounded-xl border border-border bg-surface">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold text-foreground">Billing address</h2>
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-2">
                {[
                  { label: "Country",     placeholder: "United States",  full: true },
                  { label: "Address",     placeholder: "123 Main Street", full: true },
                  { label: "City",        placeholder: "New York" },
                  { label: "State / ZIP", placeholder: "NY 10001" },
                ].map((f) => (
                  <div key={f.label} className={f.full ? "md:col-span-2" : ""}>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      {f.label}
                    </label>
                    <input
                      placeholder={f.placeholder}
                      className="h-10 w-full rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-border-strong focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Link
                to="/booking"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
              <Link
                to="/confirmation"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.86_0.17_92/0.5)] hover:opacity-90"
              >
                <Lock className="h-4 w-4" /> Pay $1,240.00
              </Link>
            </div>
          </div>

          {/* Right — order summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Order summary</h3>
                <div className="space-y-2.5 text-xs">
                  {[
                    ["Range Rover Sport · 6 days", "$1,104.00"],
                    ["Airport surcharge",           "$24.00"],
                    ["Insurance",                   "$72.00"],
                    ["Taxes & fees",                "$40.00"],
                  ].map(([l, v]) => (
                    <div key={l as string} className="flex justify-between text-muted-foreground">
                      <span>{l}</span>
                      <span className="text-foreground">{v}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-border pt-2.5 text-sm font-semibold">
                    <span className="text-foreground">Total (USD)</span>
                    <span className="text-lg text-foreground">$1,240.00</span>
                  </div>
                </div>
              </div>

              {/* Security badges */}
              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="space-y-2.5">
                  {[
                    { icon: Lock,   text: "Payments are end-to-end encrypted" },
                    { icon: Shield, text: "PCI DSS Level 1 compliant processing" },
                    { icon: CheckCircle2, text: "Free cancellation before 24h" },
                  ].map((t) => (
                    <div key={t.text} className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
                      <t.icon className="h-3 w-3 shrink-0 text-success" />
                      {t.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
