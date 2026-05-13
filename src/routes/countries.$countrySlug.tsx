import { Link, createFileRoute } from "@tanstack/react-router";

import { MarketingChrome } from "@/components/marketing/marketing-chrome";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentMeta } from "@/lib/marketing/use-document-meta";
import { useMarketplaceCountry } from "@/hooks/use-marketplace";

export const Route = createFileRoute("/countries/$countrySlug")({
  component: CountryProfilePage,
});

function CountryProfilePage() {
  const { countrySlug } = Route.useParams();
  const countryQuery = useMarketplaceCountry(countrySlug);

  const country = countryQuery.data;

  useDocumentMeta(
    country ? `${country.name} Rental Desk · FleetNexus` : "FleetNexus Destination Profile",
    country?.headline ??
      "Country-level dossier hydrating from Postgres with linked city & airport corridors.",
  );

  return (
    <MarketingChrome>
      <article className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <Link className="text-[13px] font-semibold text-[#60A5FA]" to="/countries">
          ← Countries index
        </Link>

        {countryQuery.isLoading ? (
          <div className="mt-12 space-y-5">
            <Skeleton className="h-14 w-[70%] max-w-xl rounded-xl bg-white/12" />
            <Skeleton className="h-32 w-full rounded-2xl bg-white/11" />
            <Skeleton className="h-36 w-full rounded-2xl bg-white/09" />
          </div>
        ) : countryQuery.isError ? (
          <div className="mt-14 rounded-2xl border border-rose-400/35 bg-rose-500/13 px-5 py-6 text-[#fca5a5]">
            <p className="font-semibold">Country slug not published in catalog.</p>
            <p className="mt-2 text-sm text-rose-200/82">
              Request for slug <span className="font-mono text-rose-100">{countrySlug}</span> responded with{" "}
              {(countryQuery.error as Error)?.message ?? "an upstream gateway error"}.
            </p>
          </div>
        ) : country ? (
          <>
            <p className="mt-12 text-[11px] font-semibold uppercase tracking-[0.34em] text-[#93C5FD]">
              {country.iso_code} · Operational theater
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#F8FAFC]">{country.name}</h1>
            {country.headline ? (
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-[#94A3B8]">{country.headline}</p>
            ) : (
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-[#94A3B8]">
                Catalog editors have not yet published a corridor narrative—destinations listed below remain
                authoritative operational anchors.
              </p>
            )}

            <div className="mt-12 space-y-4">
              <h2 className="text-lg font-semibold text-[#F8FAFC]">Anchored corridors</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {country.destinations.map((destination) =>
                  destination.kind === "AIRPORT" ? (
                    <Link
                      key={destination.id}
                      className="rounded-2xl border border-white/10 bg-[#0F172A]/70 px-5 py-4 text-sm text-[#E2E8F0]"
                      to="/car-rental/airport/$slug"
                      params={{ slug: destination.slug }}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#93C5FD]">
                        Airport · {destination.iata_code ?? "—"}
                      </p>
                      <p className="mt-3 text-[15px] font-semibold text-[#F8FAFC]">{destination.name}</p>
                      <p className="mt-2 text-[13px] text-[#94A3B8]">
                        {destination.subtitle ?? "Concierge dossier synced from catalog migrations."}
                      </p>
                    </Link>
                  ) : (
                    <Link
                      key={destination.id}
                      className="rounded-2xl border border-white/10 bg-[#0F172A]/70 px-5 py-4 text-sm text-[#E2E8F0]"
                      to="/car-rental/city/$slug"
                      params={{ slug: destination.slug }}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F5B301]">
                        Metropolitan coverage
                      </p>
                      <p className="mt-3 text-[15px] font-semibold text-[#F8FAFC]">{destination.name}</p>
                      <p className="mt-2 text-[13px] text-[#94A3B8]">
                        {destination.subtitle ?? "Concierge dossier synced from catalog migrations."}
                      </p>
                    </Link>
                  ),
                )}
              </div>
            </div>
          </>
        ) : null}
      </article>
    </MarketingChrome>
  );
}
