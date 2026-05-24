import Link from "next/link";
import type { Route } from "next";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "How does Book my Carz compare rental prices?",
    a: "We search 800+ suppliers in real time and surface transparent total prices — no hidden fees at checkout.",
  },
  {
    q: "Can I cancel my booking for free?",
    a: "Most rentals include free cancellation up to 48 hours before pickup. Terms vary by supplier and rate.",
  },
  {
    q: "What do I need at the rental counter?",
    a: "A valid driver's license, passport or ID, and the credit card used for booking. Age and residency rules apply.",
  },
  {
    q: "Is my payment secure?",
    a: "Yes. All transactions use 256-bit SSL encryption and PCI DSS compliant payment processing.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="py-16 md:py-24">
      <div className="container-page max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">FAQ</p>
        <h2 className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">
          Frequently asked questions
        </h2>

        <div className="mt-8 space-y-3">
          {faqs.map((f, i) => (
            <details
              key={f.q}
              open={i === 0}
              className="group rounded-2xl border border-border bg-white p-5 shadow-card"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-display text-base font-semibold text-foreground">
                {f.q}
                <ChevronDown className="size-5 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          More answers on our{" "}
          <Link href={"/faq" as Route} className="font-semibold text-brand-primary hover:underline">
            full FAQ page
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
