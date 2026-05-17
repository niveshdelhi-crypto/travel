import type { Metadata } from "next";
import Link from "next/link";

type Props = { params: Promise<{ country: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const label = country.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `Car Rental ${label} | FleetNexus`,
    description: `Compare car rental prices in ${label}. 800+ suppliers, best price guarantee.`,
  };
}

export default async function CountryPage({ params }: Props) {
  const { country } = await params;
  const label = country.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="min-h-screen bg-background">
      <div className="container-page py-16">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
          Car rental
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold text-foreground">
          Car rental in {label}
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          City-level inventory and live pricing for {label} are being rolled out. Start a search
          from the homepage and our team will match available suppliers for your route.
        </p>
        <Link
          href="/#search"
          className="mt-8 inline-flex rounded-2xl bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-cta hover:brightness-110"
        >
          Search cars in {label}
        </Link>
      </div>
    </div>
  );
}
