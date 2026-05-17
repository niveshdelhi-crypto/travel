import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { MarketingChrome } from "@/components/marketing/marketing-chrome";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentMeta } from "@/lib/marketing/use-document-meta";
import { useMarketplaceCountries } from "@/hooks/use-marketplace";

export const Route = createFileRoute("/countries")({
  component: CountriesCatalogPage,
});

function CountriesCatalogPage() {
  useDocumentMeta(
    "FleetNexus Worldwide Rental Coverage · Countries Catalog",
    "Database-backed geography index for concierge-assisted bookings across audited rental corridors.",
  );

  const countriesQuery = useMarketplaceCountries();

  return (
    <MarketingChrome>
      <article className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#60A5FA]">
          Postgres catalog · GET /marketplace/countries
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-[#F8FAFC] sm:text-5xl">
          Countries &amp; operating theaters
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-[#94A3B8]">
          Every row below originates from audited marketplace migrations. Empty states mean the operational
          database has not been hydrated—they are truthful, not marketing filler.
        </p>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {countriesQuery.isLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={`country-${idx}`} className="h-52 rounded-3xl bg-white/14" />
            ))
          ) : Array.isArray(countriesQuery.data) && countriesQuery.data.length > 0 ? (
            countriesQuery.data.map((country) => (
              <Link
                key={country.id}
                to="/countries/$countrySlug"
                params={{ countrySlug: country.slug }}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0F172A]/70 p-6 shadow-xl transition hover:border-[#F5B301]/40"
              >
                <div className="pointer-events-none absolute inset-x-24 top-[-40%] h-40 rounded-full bg-[radial-gradient(circle_at_center,rgba(245,179,1,0.18),transparent_70%)] opacity-70 transition group-hover:opacity-100" />
                <div className="relative flex items-start justify-between gap-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#94A3B8]">
                      {country.iso_code}
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold text-[#F8FAFC]">{country.name}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-[#CBD5F5]/78">
                      {country.headline ?? "Operational narrative awaiting catalog editors."}
                    </p>
                  </div>
                  <span className="rounded-xl border border-white/14 px-3 py-2 text-[11px] font-semibold text-[#93C5FD]">
                    {country._count.destinations} dossiers
                  </span>
                </div>
                <span className="relative mt-8 inline-flex items-center gap-2 text-[13px] font-semibold text-[#F5B301]">
                  Explore corridors <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))
          ) : (
            <p className="text-sm text-[#94A3B8]">
              Countries have not landed in this database instance—run prisma migrate deploy and prisma db
              seed against the API datastore.
            </p>
          )}
        </div>
      </article>
    </MarketingChrome>
  );
}
