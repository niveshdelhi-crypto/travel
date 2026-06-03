import { BadgeDollarSign, Clock4, Globe2, Lock, ShieldCheck, Zap } from "lucide-react";

const features = [
  {
    icon: BadgeDollarSign,
    title: "Best price guarantee",
    desc: "Save up to 40% with transparent pricing across 800+ suppliers.",
  },
  {
    icon: ShieldCheck,
    title: "Free cancellation",
    desc: "Most rentals can be cancelled free up to 48 hours before pickup.",
  },
  {
    icon: Clock4,
    title: "24/7 support",
    desc: "Real humans, every time-zone, before, during and after your trip.",
  },
  {
    icon: Lock,
    title: "Secure payments",
    desc: "256-bit SSL, PCI DSS compliant, fraud-protected checkout.",
  },
  {
    icon: Zap,
    title: "Instant confirmation",
    desc: "Booking confirmed in seconds with voucher in your inbox.",
  },
  {
    icon: Globe2,
    title: "Global inventory",
    desc: "30,000+ pickup points in 190+ countries — book one place.",
  },
];

export function WhyUsSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
            Why MarkleTravelBooking
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            The smartest way to book a rental car
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              className="group rounded-2xl border border-border bg-white p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-primary/10 to-brand-accent/20 text-brand-primary">
                <f.icon className="size-6" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
