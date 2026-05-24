import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, type ReactNode } from "react";
import {
  BadgeCheck,
  Headphones,
  Phone,
  Plane,
  Radio,
  ShieldCheck,
  Sparkles,
  Star,
  ArrowRight,
  ClipboardCheck,
} from "lucide-react";

import heroCar from "@/assets/hero-car.jpg";
import suvImg from "@/assets/car-suv.jpg";
import sedanImg from "@/assets/car-sedan.jpg";
import sportsImg from "@/assets/car-sports.jpg";
import evImg from "@/assets/car-ev.jpg";

import { BookingWidget } from "@/components/marketing/booking-widget";
import { MarketingChrome } from "@/components/marketing/marketing-chrome";
import { MarketingSectionErrorBoundary } from "@/components/marketing/marketing-error-boundary";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentMeta } from "@/lib/marketing/use-document-meta";
import { HOME_FAQ } from "@/lib/marketing/faq-data";
import {
  useMarketplaceSuppliers,
  useMarketplaceTestimonials,
  useMarketplaceTrustSnapshot,
  useTrendingDestinations,
} from "@/hooks/use-marketplace";

export function BookMyCarzHomePage() {
  useDocumentMeta(
    "Book my Carz — Premium global car rental marketplace",
    "Concierge-assisted booking with verified supply, live operations posture, and Postgres-backed destination intelligence.",
  );

  const trustQuery = useMarketplaceTrustSnapshot();
  const suppliersQuery = useMarketplaceSuppliers();
  const testimonialsQuery = useMarketplaceTestimonials();
  const trendingQuery = useTrendingDestinations(10);

  const locationHints = useMemo(() => {
    const rows = trendingQuery.data;
    return Array.isArray(rows) ? rows.map((destination) => destination.name) : [];
  }, [trendingQuery.data]);

  return (
    <MarketingChrome navVariant="glass">
      <MarketingSectionErrorBoundary sectionName="hero">
        <Hero locationHints={locationHints} trustSnapshot={trustQuery.data} trustLoading={trustQuery.isLoading} />
      </MarketingSectionErrorBoundary>

      <SupplierStrip query={suppliersQuery} />
      <InsuranceTransparency />
      <HowItWorks />
      <TrendingRail query={trendingQuery} />
      <FleetShowcase />
      <LiveOperationsPanel query={trustQuery} />

      <MarketingSectionErrorBoundary sectionName="social-proof">
        <TestimonialSection query={testimonialsQuery} />
      </MarketingSectionErrorBoundary>

      <FaqSection />
      <FinalCtaRail />
    </MarketingChrome>
  );
}

function Hero({
  locationHints,
  trustSnapshot,
  trustLoading,
}: {
  locationHints: string[];
  trustSnapshot: ReturnType<typeof useMarketplaceTrustSnapshot>["data"];
  trustLoading: boolean;
}) {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 min-h-full">
        <img
          src={heroCar}
          alt="Nighttime premium sedan staged for global airport transfer"
          width={1920}
          height={1280}
          className="h-[115%] min-h-full w-full object-cover object-[center_36%] opacity-95"
          style={{ transform: "scale(1.06)" }}
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07111F]/98 via-[#07111F]/78 to-[#07111F]/40" />
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-b from-transparent via-[#07111F]/92 to-[#07111F]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.11),transparent_60%)]" />
      </div>

      <div className="relative flex min-h-[calc(100svh-76px)] flex-col justify-center py-8 sm:py-10 lg:py-12">
        <div className="mx-auto grid w-full max-w-[1180px] grid-cols-1 items-center gap-10 px-4 sm:gap-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_min(100%,460px)] lg:gap-x-10 lg:gap-y-0 xl:grid-cols-[minmax(0,1.12fr)_min(100%,480px)] xl:gap-x-12">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex min-w-0 max-w-2xl flex-col justify-center justify-self-center lg:max-w-none lg:justify-self-stretch"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.12, duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-[#F5B301]/40 bg-black/40 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.42em] text-[#FCD34D]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Intelligent mobility fabric
            </motion.div>

            <h1 className="mt-5 text-balance text-[clamp(1.95rem,4.2vw,3.35rem)] font-semibold leading-[1.08] tracking-tight text-[#F8FAFC] xl:text-[clamp(2.1rem,3.6vw,3.5rem)]">
              A premium travel desk for your next{" "}
              <span className="bg-gradient-to-r from-[#F5B301] via-[#FCD34D] to-[#3B82F6] bg-clip-text text-transparent">
                global rental corridor
              </span>
              .
            </h1>

            <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-[#E2E8F0]/86 sm:text-lg">
              Book my Carz centralizes supplier verification, assisted booking, and live operations posture
              so arrivals feel choreographed—not improvised at a counter kiosk.
            </p>

            <div className="mt-6 grid max-w-xl grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/12 bg-black/40 shadow-[0_40px_120px_-60px_rgba(15,23,42,1)] backdrop-blur-xl sm:grid-cols-3 lg:max-w-lg">
              <StatCell
                title="Assisted requests"
                value={trustSnapshot?.assistedRequestsLifetime}
                loading={trustLoading}
              />
              <StatCell
                title="Rolling 24h volume"
                value={trustSnapshot?.assistedRequests24h}
                loading={trustLoading}
              />
              <StatCell
                title="Active advisors"
                value={trustSnapshot?.advisoryCapacityAgents}
                loading={trustLoading}
                suffix="agents"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5 text-xs font-semibold text-[#E2E8F0]/80">
              <PillTrust icon={BadgeCheck}>SOC-minded intake</PillTrust>
              <PillTrust icon={Plane}>ICAO-aligned planning</PillTrust>
              <PillTrust icon={Radio}>Live Postgres signals</PillTrust>
            </div>
          </motion.div>

          <div className="flex w-full min-w-0 items-stretch justify-self-stretch lg:max-w-[460px] lg:justify-self-end">
            <BookingWidget locationHints={locationHints} />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCell({
  title,
  value,
  loading,
  suffix,
}: {
  title: string;
  value?: number;
  loading: boolean;
  suffix?: string;
}) {
  return (
    <div className="bg-[#0F172A]/78 px-3 py-3 sm:px-4 sm:py-3.5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-[#94A3B8] sm:text-[10px] sm:tracking-[0.28em]">
        {title}
      </p>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-20 rounded-md bg-white/10" />
      ) : (
        <div className="mt-2 flex items-baseline gap-1.5">
          <AnimatedNumber value={value ?? 0} />
          {suffix ? <span className="text-xs text-[#94A3B8]">{suffix}</span> : null}
        </div>
      )}
    </div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0.35, filter: "blur(2px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="inline-block text-2xl font-semibold text-[#F5B301] tabular-nums sm:text-3xl"
    >
      {value.toLocaleString()}
    </motion.span>
  );
}

function PillTrust({ icon: Icon, children }: { icon: typeof BadgeCheck; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-black/45 px-3 py-2 backdrop-blur">
      <Icon className="h-3.5 w-3.5 text-[#F5B301]" />
      {children}
    </span>
  );
}

function SupplierStrip({ query }: { query: ReturnType<typeof useMarketplaceSuppliers> }) {
  return (
    <section className="border-y border-white/10 bg-[#0a1524]/95">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-14 lg:px-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#60A5FA]">
            Verified supply stack
          </p>
          <p className="mt-4 text-lg leading-relaxed text-[#CBD5F5]/88">
            Logos hydrate from Postgres: no manually duplicated partner grids layered on staging builds.
          </p>
          <div className="mt-6 flex flex-wrap gap-5 text-[11px] text-[#94A3B8]">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#F5B301]" /> Insurance escalations scripted
            </span>
            <span className="inline-flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#3B82F6]" /> 24h escalation bridge
            </span>
          </div>
        </div>
        <div className="relative min-h-[112px] min-w-0">
          {query.isLoading ? (
            <div className="flex flex-wrap gap-3 lg:justify-end">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={`sup-${idx}`} className="h-14 w-[128px] rounded-xl bg-white/10" />
              ))}
            </div>
          ) : Array.isArray(query.data) && query.data.length > 0 ? (
            <div className="group/marquee relative overflow-hidden rounded-2xl border border-white/12 bg-[#060f1c]/80 py-5">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-[#0a1524] to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-[#0a1524] to-transparent" />
              <div className="flex w-max gap-10 px-6 animate-fleet-marquee group-hover/marquee:[animation-play-state:paused]">
                {[...query.data, ...query.data].map((supplier, idx) => (
                  <motion.div
                    id={idx === 0 ? `suppliers-${supplier.slug}` : undefined}
                    layout
                    key={`${supplier.id}-${idx}`}
                    className="relative flex w-[200px] shrink-0 flex-col gap-3 rounded-xl border border-white/14 bg-[#0F172A]/70 px-4 py-4 text-sm font-semibold text-[#E2E8F0]"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#F5B301]/0 via-transparent to-[#3B82F6]/13 opacity-0 transition group-hover/marquee:opacity-100" />
                    <div className="relative flex flex-col gap-3">
                      {supplier.logo_url ? (
                        <img
                          src={supplier.logo_url}
                          alt={supplier.name}
                          className="h-11 max-w-[180px] object-contain brightness-105"
                        />
                      ) : (
                        <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#94A3B8]">
                          {supplier.slug.replace(/-/g, " ")}
                        </span>
                      )}
                      <a
                        className="text-[11px] font-semibold text-[#60A5FA]"
                        href={supplier.website_url ?? "#lead-form"}
                        rel="noreferrer"
                        target={supplier.website_url ? "_blank" : undefined}
                      >
                        View partner HQ ↗
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#64748b]">
              Marketplace suppliers will appear automatically after migrating the catalog migrations.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function InsuranceTransparency() {
  return (
    <section className="bg-[#F8FAFC] px-4 py-16 text-[#111827] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.94fr_1.06fr] lg:items-center">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#0F172A] shadow-[0_56px_120px_-72px_rgba(15,23,42,.75)]">
          <img src={sedanImg} alt="Fleet vehicle illustrating coverage clarity" className="h-80 w-full object-cover opacity-94" loading="lazy" />
          <div className="space-y-2 bg-gradient-to-b from-[#0F172A] to-[#050b13] px-6 py-6 text-[#F8FAFC]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#60A5FA]">
              Insurance clarity
            </p>
            <p className="text-lg font-semibold leading-snug">
              Stacks are unpacked before funds move—collision waivers are never implied silently.
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#334155]">
            Transparency charter
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-[2.75rem] sm:leading-[1.04]">
            Premium expectations begin with underwriting honesty.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            Public intake hides payment rails by design until an advisor aligns on partner economics. Detailed
            policy stacks, deposit handling, airport concession fees, and age rules live in{" "}
            <Link className="font-semibold text-[#2563eb]" to="/conditions">
              /conditions
            </Link>
            .
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <CardLight
              icon={ShieldCheck}
              title="Regulated waivers only"
              body="Book my Carz does not fabricate captive insurance—it mirrors products filed by licensed partners."
            />
            <CardLight
              icon={ClipboardCheck}
              title="Signed confirmations"
              body="Advisor PDFs enumerate waivers, deposits, and airport recovery before you countersign—nothing implied verbally off-channel."
            />
            <CardLight
              icon={Headphones}
              title="Duty-of-care support"
              body="Incident hotlines escalate to partner risk teams alongside Book my Carz command channels."
            />
            <CardLight
              icon={Plane}
              title="Airport surcharges disclosed"
              body="Facility recovery fees are enumerated—not buried in teaser rates online."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function CardLight({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/[0.04]">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#0F172A] text-[#F5B301]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-lg font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{body}</p>
    </article>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "Ingress & validation",
      body: "Your itinerary hits `/api/leads/public` idempotently, lands in Postgres, and fans out via websocket signals to dashboards.",
    },
    {
      title: "Correlation & underwriting",
      body: "Advisors reconcile partner SLA, baggage timing, chauffeur requests, EV constraints, or membership bundles before quoting.",
    },
    {
      title: "Fulfillment choreography",
      body: "Once ratified, partners receive structured metadata; CRM retains auditable timelines for SOC-minded organizations.",
    },
  ];

  return (
    <section className="bg-[#07111F] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Flow"
          title="Operational choreography—not a brittle widget."
          copy="TanStack Query hydrates Postgres-backed catalogs while Mutations synchronize with guarded Nest pipelines."
          dark
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {steps.map((step, index) => (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: index * 0.06, duration: 0.45 }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0F172A]/75 p-6 shadow-[0_40px_120px_-80px_black]"
            >
              <div className="absolute inset-x-12 top-6 h-[1px] bg-gradient-to-r from-transparent via-white/36 to-transparent" />
              <p className="text-sm font-semibold text-[#3B82F6]">{String(index + 1).padStart(2, "0")}</p>
              <h3 className="mt-4 text-xl font-semibold text-[#F8FAFC]">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#CBD5F5]/78">{step.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrendingRail({ query }: { query: ReturnType<typeof useTrendingDestinations> }) {
  return (
    <section className="bg-[#0a1626] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Postgres-fed destinations"
          title="Trending corridors update as catalog planners rebalance routing."
          copy="Slug architecture powers `/countries`, `/car-rental/city/:slug`, and `/car-rental/airport/:slug` without renaming components."
          dark
        />

        <div className="mt-10 flex flex-wrap justify-center gap-4 lg:justify-start">
            {query.isLoading
              ? Array.from({ length: 5 }).map((_, idx) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <Skeleton key={`trend-${idx}`} className="h-52 w-[280px] shrink-0 rounded-2xl bg-white/11" />
                ))
              : Array.isArray(query.data)
                ? query.data.map((destination, idx) => (
                  <motion.div
                    key={destination.id}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className="w-[272px] shrink-0 rounded-2xl border border-white/13 bg-[#0F172A]/75 p-5 shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#93C5FD]">
                          {destination.kind === "AIRPORT" ? "Airport lattice" : "Urban fabric"}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-[#F8FAFC]">{destination.name}</h3>
                      </div>
                      <span className="rounded-md border border-white/14 px-2 py-1 text-[10px] text-[#E2E8F0]/70">
                        {destination.country.iso_code}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[#CBD5F5]/78">
                      {destination.subtitle ?? "Curated corridor with concierge-grade intake."}
                    </p>
                    {destination.kind === "AIRPORT" ? (
                      <Link
                        to="/car-rental/airport/$slug"
                        params={{ slug: destination.slug }}
                        className="mt-5 inline-flex items-center gap-1 text-[13px] font-semibold text-[#F5B301]"
                      >
                        Open destination dossier <ArrowRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <Link
                        to="/car-rental/city/$slug"
                        params={{ slug: destination.slug }}
                        className="mt-5 inline-flex items-center gap-1 text-[13px] font-semibold text-[#F5B301]"
                      >
                        Open destination dossier <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </motion.div>
                ))
                : null}
        </div>
      </div>
    </section>
  );
}

function FleetShowcase() {
  const fleet = [
    { name: "Executive SUV", image: suvImg, tone: "Luggage-heavy arrivals", slug: "#lead-form" },
    { name: "Executive Sedan", image: sedanImg, tone: "Board-level discretion", slug: "#lead-form" },
    { name: "Performance GT", image: sportsImg, tone: "Symbolic presence", slug: "#lead-form" },
    { name: "Electrified", image: evImg, tone: "Zero-local-emission itineraries", slug: "#lead-form" },
  ];

  return (
    <section id="fleet" className="bg-[#050b14] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Vehicle intelligence"
          title="Imagery aligns with tactile luxury cues inside your concierge brief."
          copy="Fleet photography is authored in-house—not scraped from unnamed stock feeds—to maintain trust parity with upscale brands."
          dark
        />

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {fleet.map((item, index) => (
            <motion.a
              key={item.name}
              href={item.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: index * 0.06, duration: 0.45 }}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0F172A]/70 shadow-[0_40px_150px_-80px_black]"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img src={item.image} alt={`${item.name} concierge class`} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
              </div>
              <div className="border-t border-white/10 px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#93C5FD]">{item.tone}</p>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <h3 className="text-xl font-semibold text-[#F8FAFC]">{item.name}</h3>
                  <ArrowRight className="h-4 w-4 text-[#F5B301] transition group-hover:translate-x-1" />
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

function LiveOperationsPanel({ query }: { query: ReturnType<typeof useMarketplaceTrustSnapshot> }) {
  const snapshot = query.data;

  return (
    <section className="bg-[#081525] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[0.94fr_1.06fr] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Live posture"
              title="Operational transparency without leaking PII."
              copy="Pickup strings are distilled to corridor fragments; statuses reflect real CRM rows ingested moments ago."
              dark
              align="start"
            />
            <dl className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-300/35 bg-emerald-500/15 px-5 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
                  Rolling average outreach delta
                </dt>
                <dd className="mt-3 text-2xl font-semibold text-[#DCFCE7]">
                  {query.isLoading ? (
                    <Skeleton className="h-9 w-32 rounded-lg bg-emerald-200/35" />
                  ) : snapshot?.avgAdvisorResponseMinutes != null ? (
                    `${snapshot.avgAdvisorResponseMinutes} min`
                  ) : (
                    "Awaiting history"
                  )}
                </dd>
                <dd className="mt-3 text-[11px] leading-relaxed text-emerald-100/70">
                  Computed strictly from Postgres `last_contacted_at - created_at` over trailing 120 days.
                </dd>
              </div>
              <div className="rounded-2xl border border-white/13 bg-black/38 px-5 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[#CBD5F5]/70">
                  Status prism
                </dt>
                <dd className="mt-4 space-y-2 text-[13px] text-[#F8FAFC]/78">
                  {query.isLoading
                    ? Array.from({ length: 4 }).map((_, idx) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <Skeleton key={`bk-${idx}`} className="h-6 w-full rounded-md bg-white/10" />
                      ))
                    : snapshot
                      ? Object.entries(snapshot.leadStatusBreakdown).map(([status, total]) => (
                          <div key={status} className="flex items-center justify-between gap-6">
                            <span className="font-mono text-[11px] text-[#94A3B8]">{status}</span>
                            <span className="font-semibold text-[#F5B301] tabular-nums">{total}</span>
                          </div>
                        ))
                    : null}
                </dd>
              </div>
            </dl>
          </div>

          <motion.div layout className="rounded-3xl border border-white/13 bg-[#0F172A]/75 p-4 shadow-[0_60px_160px_-80px_rgba(2,10,26,1)]">
            <header className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F5B301]">
                  Corridor signals
                </p>
                <p className="mt-2 text-xl font-semibold text-[#F8FAFC]">Recent assistance fabric</p>
              </div>
              <Radio className="h-9 w-9 text-emerald-300" aria-hidden />
            </header>
            <div className="mt-5 space-y-1">
              {query.isLoading
                ? Array.from({ length: 6 }).map((_, idx) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <Skeleton key={`signal-${idx}`} className="h-14 w-full rounded-xl bg-white/10" />
                  ))
                : snapshot?.recentAssistanceSignals?.length
                  ? snapshot.recentAssistanceSignals.map((signal) => (
                      <article
                        key={`${signal.corridorLabel}-${signal.createdAt}`}
                        className="flex flex-col gap-2 rounded-xl border border-white/8 bg-black/42 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#F8FAFC]">{signal.corridorLabel}</p>
                          <p className="text-[11px] text-[#94A3B8]">
                            Ingress {new Date(signal.createdAt).toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
                          </p>
                        </div>
                        <span className="rounded-md border border-emerald-200/35 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-100">
                          {signal.phaseLabel}
                        </span>
                      </article>
                    ))
                  : (
                    <p className="text-sm text-[#94A3B8]">
                      No corridors yet today—signals appear as authenticated leads stream through the API surface.
                    </p>
                  )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function TestimonialSection({ query }: { query: ReturnType<typeof useMarketplaceTestimonials> }) {
  return (
    <section className="bg-[#07111F] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Editorial viewpoints"
          title="Book my Carz curates tonal references—not fabricated star ratings tied to phantom profiles."
          copy="Stories below are seeded as editorial vignettes flagged `is_editorial` in Postgres. Swap them out with verified customer attestations anytime."
          dark
        />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {query.isLoading
            ? Array.from({ length: 3 }).map((_, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <Skeleton key={`tes-${idx}`} className="h-72 rounded-3xl bg-white/14" />
              ))
            : Array.isArray(query.data)
              ? query.data.map((story) => (
                <motion.figure
                  layout
                  key={story.id}
                  className="flex h-full flex-col rounded-3xl border border-white/12 bg-gradient-to-br from-[#0F172A]/95 to-black/62 p-6 shadow-xl"
                >
                  <div className="flex gap-1 text-[#FACC15]" aria-hidden>
                    {Array.from({ length: story.rating }).map((_, idx) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <Star key={`star-${idx}`} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-5 flex-1 text-[15px] leading-relaxed text-[#F8FAFC]/86">
                    “{story.quote}”
                  </blockquote>
                  <figcaption className="mt-6 border-t border-white/10 pt-4 text-[13px] text-[#94A3B8]">
                    <p className="font-semibold text-[#F8FAFC]">{story.author_display}</p>
                    {story.meta_line ? <p className="mt-1">{story.meta_line}</p> : null}
                  </figcaption>
                </motion.figure>
              ))
              : null}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="border-t border-white/10 bg-[#040912] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="FAQ"
          title="Executive answers for travelers who dislike guesswork."
          copy="Operational teams pair this corpus with contractual PDFs routed through Advisors."
          dark
        />

        <Accordion type="single" collapsible className="mt-10 divide-y divide-white/10 rounded-2xl border border-white/10 bg-[#0F172A]/70 px-6">
          {HOME_FAQ.map((item, index) => (
            <AccordionItem value={`faq-${index}`} key={item.q} className="border-transparent">
              <AccordionTrigger className="text-base font-semibold text-[#F8FAFC] hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="pb-6 text-sm leading-relaxed text-[#CBD5F5]/78">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function FinalCtaRail() {
  return (
    <section className="relative overflow-hidden border-t border-white/10 px-4 py-20 sm:px-6 lg:px-8">
      <img src={suvImg} alt="Premium SUV for cross-state corridor coverage" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-[0.34]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#07111F]/94 via-[#07111F]/92 to-transparent" />

      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.94fr_auto] lg:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#93C5FD]">Momentum</p>
          <h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-[#F8FAFC] sm:text-[2.4rem] sm:leading-tight">
            When travel teams require elite calm, Book my Carz is the kinetic layer behind the itinerary.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#E2E8F0]/80">
            Operators connect via `/login`; procurement teams ingest catalog JSON from `/countries` programmatically—the platform is biased toward interoperability.
          </p>
        </div>
        <Link
          to="/"
          hash="lead-form"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#F5B301] via-[#fcd34d] to-[#eab308] px-8 py-4 text-[13px] font-bold text-[#07111F] shadow-[0_40px_90px_-50px_rgba(245,179,1,.9)] hover:brightness-[1.04]"
        >
          Begin assisted booking
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  copy,
  dark,
  align = "default",
}: {
  eyebrow: string;
  title: string;
  copy: string;
  dark?: boolean;
  align?: "default" | "start";
}) {
  const tone = dark ? "text-[#93C5FD]" : "text-[#475569]";
  return (
    <div className={align === "start" ? "text-left" : "text-center"}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.32em] ${tone}`}>{eyebrow}</p>
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-[#F8FAFC] sm:text-[2.6rem] sm:leading-snug">{title}</h2>
      <p
        className={`mt-5 max-w-3xl text-pretty text-base leading-relaxed text-[#CBD5F5]/80 ${
          align === "start" ? "" : "mx-auto"
        }`}
      >
        {copy}
      </p>
    </div>
  );
}