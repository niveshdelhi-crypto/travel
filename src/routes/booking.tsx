import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Badge } from "@/components/app/primitives";
import suvImg from "@/assets/car-suv.jpg";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  CreditCard,
  Fuel,
  MapPin,
  Shield,
  Star,
  Users,
  ChevronDown,
  Cog,
  Info,
} from "lucide-react";

export const Route = createFileRoute("/booking")({
  head: () => ({
    meta: [
      { title: "Complete your booking — FleetNexus" },
      { name: "description", content: "Complete your car rental reservation securely." },
    ],
  }),
  component: BookingPage,
});

const steps = [
  { id: 1, label: "Your details" },
  { id: 2, label: "Add-ons" },
  { id: 3, label: "Payment" },
  { id: 4, label: "Confirm" },
];

function BookingPage() {
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
                        step.id === 1
                          ? "bg-primary text-primary-foreground"
                          : step.id < 1
                            ? "bg-success text-success-foreground"
                            : "border border-border bg-surface text-muted-foreground"
                      }`}
                    >
                      {step.id < 1 ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        step.id === 1 ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="mx-3 h-px w-10 bg-border" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-10 lg:grid-cols-5">
          {/* Left — form */}
          <div className="space-y-6 lg:col-span-3">
            {/* Driver details */}
            <section className="rounded-xl border border-border bg-surface">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold text-foreground">Primary driver details</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Driver must be 25+ and present a valid license</p>
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-2">
                {[
                  { label: "First name",    placeholder: "John",               type: "text" },
                  { label: "Last name",     placeholder: "Smith",              type: "text" },
                  { label: "Email",         placeholder: "john@example.com",   type: "email" },
                  { label: "Phone",         placeholder: "+1 (555) 000-0000",  type: "tel" },
                  { label: "Date of birth", placeholder: "MM / DD / YYYY",     type: "text" },
                  { label: "License no.",   placeholder: "DL-XXXXXXXX",        type: "text" },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      className="h-10 w-full rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-border-strong focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Flight info */}
            <section className="rounded-xl border border-border bg-surface">
              <div className="border-b border-border px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Flight information</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">Optional — helps with airport coordination</p>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" className="accent-primary" /> Add flight details
                  </label>
                </div>
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-2">
                {[
                  { label: "Airline",        placeholder: "e.g. Delta" },
                  { label: "Flight number",  placeholder: "e.g. DL 1234" },
                  { label: "Arrival time",   placeholder: "HH:MM" },
                  { label: "Terminal",       placeholder: "e.g. Terminal 4" },
                ].map((f) => (
                  <div key={f.label}>
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
                to="/search"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back to search
              </Link>
              <Link
                to="/payment"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.86_0.17_92/0.5)] hover:opacity-90"
              >
                Continue to payment <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Right — booking summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-xl border border-border bg-surface">
                <div className="border-b border-border px-5 py-4">
                  <h3 className="text-sm font-semibold text-foreground">Booking summary</h3>
                </div>

                {/* Vehicle */}
                <div className="p-5">
                  <div className="overflow-hidden rounded-lg border border-border bg-surface-2">
                    <img src={suvImg} alt="Range Rover Sport" className="h-36 w-full object-cover" />
                    <div className="p-3">
                      <div className="text-sm font-semibold text-foreground">Range Rover Sport</div>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <span>Hertz</span>
                        <span>·</span>
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        <span className="text-foreground">4.9</span>
                      </div>
                      <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> 7</span>
                        <span className="flex items-center gap-1"><Cog className="h-3 w-3" /> Auto</span>
                        <span className="flex items-center gap-1"><Fuel className="h-3 w-3" /> Hybrid</span>
                      </div>
                    </div>
                  </div>

                  {/* Trip details */}
                  <div className="mt-4 space-y-3 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="text-foreground">JFK Airport, NY</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>Manhattan, NY</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>May 12 → May 18 · 6 days</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>Pickup 10:00 · Return 10:00</span>
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div className="mt-5 space-y-2.5 border-t border-border pt-4 text-xs">
                    {[
                      ["Base rate (6 × $184)", "$1,104.00"],
                      ["Airport surcharge",    "$24.00"],
                      ["Insurance",            "$72.00"],
                      ["Taxes & fees",         "$40.00"],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between text-muted-foreground">
                        <span>{label}</span>
                        <span className="text-foreground">{val}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-border pt-2.5 font-semibold">
                      <span className="text-foreground">Total</span>
                      <span className="text-lg text-foreground">$1,240.00</span>
                    </div>
                  </div>

                  {/* Trust badges */}
                  <div className="mt-4 space-y-2">
                    {[
                      { icon: Shield,      text: "Free cancellation up to 24h before pickup" },
                      { icon: CreditCard,  text: "No charge until confirmation" },
                      { icon: Info,        text: "Price includes all mandatory fees" },
                    ].map((t) => (
                      <div key={t.text} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                        <t.icon className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                        {t.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Assisted booking panel */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/20 text-primary">
                    <Car className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">Need help booking?</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      Our agents are available 24/7 to assist you with this reservation.
                    </div>
                    <button className="mt-2 text-xs font-medium text-primary hover:underline">
                      Request callback →
                    </button>
                  </div>
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
