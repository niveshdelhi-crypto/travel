import { Link, createFileRoute } from "@tanstack/react-router";

import { MarketingChrome } from "@/components/marketing/marketing-chrome";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentMeta } from "@/lib/marketing/use-document-meta";
import { useDestinationCity } from "@/hooks/use-marketplace";

export const Route = createFileRoute("/car-rental/city/$slug")({
  component: CityDestinationPage,
});

function CityDestinationPage() {
  const { slug } = Route.useParams();
  const destinationQuery = useDestinationCity(slug);
  const destination = destinationQuery.data;

  useDocumentMeta(
    destination?.seo_title ??
      `${destination?.name ?? "City corridor"} concierge car rental assistance · FleetNexus`,
    destination?.seo_description ??
      "Operational dossier seeded from Postgres; advisors refine partner mix per itinerary.",
  );

  return (
    <MarketingChrome>
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-3 text-[13px] font-semibold text-[#60A5FA]">
          <Link to="/countries">Countries</Link>
          <span className="text-[#475569]">/</span>
          {destination?.country.slug ? (
            <Link params={{ countrySlug: destination.country.slug }} to="/countries/$countrySlug">
              {destination.country.name}
            </Link>
          ) : (
            <span>Routed nation</span>
          )}
          <span className="text-[#475569]">/</span>
          <span className="text-[#CBD5F5]">City dossier</span>
        </div>

        {destinationQuery.isLoading ? (
          <div className="mt-10 space-y-4">
            <Skeleton className="h-12 w-[85%] max-w-xl rounded-xl bg-white/13" />
            <Skeleton className="h-24 w-full rounded-2xl bg-white/09" />
            <Skeleton className="h-40 w-full rounded-3xl bg-white/08" />
          </div>
        ) : destinationQuery.isError ? (
          <p className="mt-14 text-sm text-rose-300">City slug unresolved—verify catalog hydration.</p>
        ) : destination ? (
          <div className="mt-10">
            <h1 className="text-4xl font-semibold tracking-tight text-[#F8FAFC]">{destination.name}</h1>
            <p className="mt-6 text-base leading-relaxed text-[#94A3B8]">{destination.subtitle}</p>

            <div className="mt-10 rounded-3xl border border-white/13 bg-[#0F172A]/70 px-7 py-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#93C5FD]">
                Engineered itineraries
              </p>
              <p className="mt-5 text-[15px] leading-relaxed text-[#E2E8F0]/86">
                This page is statically generated metadata over live database rows—the booking widget anchors
                to actual `/api/leads/public` ingestion for any premium urban routing through{" "}
                <Link className="text-[#60A5FA]" to="/" hash="lead-form">
                  assisted booking
                </Link>
                .
              </p>
            </div>
          </div>
        ) : null}
      </article>
    </MarketingChrome>
  );
}
