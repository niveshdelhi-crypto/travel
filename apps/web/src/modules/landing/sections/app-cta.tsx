import Link from "next/link";
import type { Route } from "next";
import { Headphones, Smartphone } from "lucide-react";

export function AppCtaSection() {
  return (
    <section className="bg-surface-muted py-16 md:py-20">
      <div className="container-page">
        <div className="overflow-hidden rounded-3xl bg-navy p-8 text-navy-foreground md:flex md:items-center md:justify-between md:p-12">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent">Support</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Need help? We&apos;re here 24/7
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              Manage bookings, change reservations, or get expert advice before you travel.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row md:mt-0">
            <Link
              href={"/contact" as Route}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-primary px-6 py-3.5 text-sm font-semibold text-white shadow-cta transition hover:brightness-110"
            >
              <Headphones className="size-4" />
              Contact support
            </Link>
            <span className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 px-6 py-3.5 text-sm font-medium text-white/80">
              <Smartphone className="size-4" />
              Mobile app — coming soon
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
