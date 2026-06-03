import { Link, createFileRoute } from "@tanstack/react-router";

import { MarketingChrome } from "@/components/marketing/marketing-chrome";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentMeta } from "@/lib/marketing/use-document-meta";
import { useDestinationAirport } from "@/hooks/use-marketplace";

export const Route = createFileRoute("/car-rental/airport/$slug")({
  component: AirportDestinationPage,
});

function AirportDestinationPage() {
  const { slug } = Route.useParams();
  const destinationQuery = useDestinationAirport(slug);
  const destination = destinationQuery.data;

  useDocumentMeta(
    destination?.seo_title ??
      `${destination?.iata_code ?? "APT"} concierge rental intake · MarkleTravelBooking`,
    destination?.seo_description ??
      "ICAO-aligned airport dossier seeded from Postgres; desk timing flows into concierge queue.",
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
          <span className="text-[#CBD5F5]">
            {(destination?.iata_code ?? "APT") + " · Airport lattice"}
          </span>
        </div>

        {destinationQuery.isLoading ? (
          <div className="mt-10 space-y-4">
            <Skeleton className="h-12 w-[88%] max-w-xl rounded-xl bg-white/13" />
            <Skeleton className="h-28 w-full rounded-2xl bg-white/09" />
            <Skeleton className="h-36 w-full rounded-3xl bg-white/07" />
          </div>
        ) : destinationQuery.isError ? (
          <p className="mt-14 text-sm text-rose-300">Airport slug unresolved—verify catalog hydration.</p>
        ) : destination ? (
          <div className="mt-10">
            <span className="rounded-full border border-[#F5B301]/40 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#fcd34d]">
              ICAO dossier · {destination.iata_code ?? "APT"}
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#F8FAFC]">{destination.name}</h1>
            <p className="mt-6 text-base leading-relaxed text-[#94A3B8]">{destination.subtitle}</p>

            <div className="mt-10 rounded-3xl border border-white/13 bg-[#0F172A]/70 px-7 py-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#93C5FD]">
                Terminal choreography
              </p>
              <p className="mt-5 text-[15px] leading-relaxed text-[#E2E8F0]/86">
                Advise concierge teams of arrivals hall selection, baggage profile, chauffeur language, EV
                state-of-charge minimums—all via assisted booking so operations enforces partner SLAs in
                Postgres without exposing traveler PII on this dossier sheet.
              </p>
              <Link
                to="/"
                hash="lead-form"
                className="mt-6 inline-flex rounded-xl bg-gradient-to-br from-[#F5B301] to-[#f59e0b] px-5 py-2 text-[13px] font-bold text-[#07111F]"
              >
                Push itinerary to concierge queue
              </Link>
            </div>
          </div>
        ) : null}
      </article>
    </MarketingChrome>
  );
}
