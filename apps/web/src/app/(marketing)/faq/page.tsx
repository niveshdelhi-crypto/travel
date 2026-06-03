import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";

export const metadata: Metadata = {
  title: "FAQ | MarkleTravelBooking",
  description: "Frequently asked questions about booking car rentals with MarkleTravelBooking.",
};

const items = [
  {
    q: "How do I search for a car?",
    a: "Use the search form on the homepage. Enter pickup and return details, then submit — our team matches you with available suppliers.",
  },
  {
    q: "When will I hear back after searching?",
    a: "Most requests receive a response within minutes during business hours. Complex routes may take longer.",
  },
  {
    q: "Can I change my booking?",
    a: "Yes. Contact support with your reference ID and we'll coordinate changes with the supplier.",
  },
  {
    q: "What payment methods are accepted?",
    a: "Payment is handled per supplier at booking or pickup. MarkleTravelBooking does not store full card numbers on our servers.",
  },
  {
    q: "Where can I read rental terms?",
    a: "See our Rental Conditions page for standard requirements. Supplier-specific terms apply at confirmation.",
  },
];

export default function FaqPage() {
  return (
    <article className="max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
        Frequently asked questions
      </h1>
      <div className="mt-8 space-y-3">
        {items.map((item, i) => (
          <details
            key={item.q}
            open={i === 0}
            className="rounded-2xl border border-border bg-white p-5"
          >
            <summary className="cursor-pointer font-display font-semibold text-foreground">
              {item.q}
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        See also{" "}
        <Link href={"/rental-conditions" as Route} className="text-brand-primary hover:underline">
          rental conditions
        </Link>{" "}
        and{" "}
        <Link href={"/privacy-policy" as Route} className="text-brand-primary hover:underline">
          privacy policy
        </Link>
        .
      </p>
    </article>
  );
}
