import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About MarkleTravelBooking",
  description:
    "Learn about MarkleTravelBooking — global car rental comparison with 800+ suppliers.",
};

export default function AboutPage() {
  return (
    <article className="max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
        About MarkleTravelBooking
      </h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        MarkleTravelBooking helps travelers compare car rental offers from 800+ suppliers across
        30,000+ locations worldwide. Our platform combines transparent pricing, secure booking, and
        expert support so you can focus on the journey ahead.
      </p>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        Behind the scenes, our operations team works with verified rental partners to coordinate
        pickups, changes, and support — backed by a production-grade platform built for reliability
        at scale.
      </p>
    </article>
  );
}
