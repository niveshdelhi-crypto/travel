import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import heroCar from "@/assets/hero-car.jpg";
import suvImg from "@/assets/car-suv.jpg";
import sedanImg from "@/assets/car-sedan.jpg";
import sportsImg from "@/assets/car-sports.jpg";
import evImg from "@/assets/car-ev.jpg";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  MapPin,
  Plane,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
  Star,
  Headphones,
  TrendingUp,
  Phone,
  Activity,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/")({
    component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <TrustedProviders />
      <Categories />
      <WhyChoose />
      <OperationalIntel />
      <Testimonials />
      <DashboardPreview />
      <CTAFooter />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img src={heroCar} alt="" className="h-full w-full object-cover opacity-60" width={1920} height={1280} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.86_0.17_92/0.08),transparent_55%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-24 pt-40">
        <div className="mx-auto max-w-3xl text-center animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Now serving 142 cities across USA & Canada
          </span>
          <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
            Find the perfect rental car{" "}
            <span className="text-gradient">across USA & Canada</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
            Compare, reserve and get assisted booking support instantly — backed by a 24/7 sales team and verified provider network.
          </p>
        </div>

        <SearchForm />

        <div className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-4 text-xs text-muted-foreground">
          {[
            ["4.9/5", "average rating"],
            ["180k+", "rentals booked"],
            ["98%", "on-time pickup"],
            ["24/7", "live support"],
          ].map(([v, l]) => (
            <div key={l} className="flex items-baseline gap-2">
              <span className="text-lg font-semibold text-foreground">{v}</span>
              <span>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SearchForm() {
  return (
    <div className="mx-auto mt-12 max-w-5xl animate-fade-up">
      <div className="rounded-2xl border border-border bg-surface/70 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-border md:grid-cols-12">
          <Field icon={MapPin} label="Pickup location" placeholder="JFK Airport, NY" className="md:col-span-3" />
          <Field icon={MapPin} label="Drop-off" placeholder="Same as pickup" className="md:col-span-3" />
          <Field icon={CalendarDays} label="Pickup" placeholder="May 12 · 10:00" className="md:col-span-2" />
          <Field icon={Clock} label="Return" placeholder="May 18 · 10:00" className="md:col-span-2" />
          <Field icon={Users} label="Driver" placeholder="25+" className="md:col-span-2" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 pb-1 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <Chip icon={Plane}>Airport pickup</Chip>
            <Chip>SUV</Chip>
            <Chip>Best price</Chip>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/search"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              Get best deal
            </Link>
            <Link
              to="/search"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.86_0.17_92/0.6)] transition hover:opacity-90"
            >
              <Search className="h-4 w-4" />
              Search vehicles
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  placeholder,
  className = "",
}: {
  icon: any;
  label: string;
  placeholder: string;
  className?: string;
}) {
  return (
    <label className={`flex items-center gap-3 bg-surface px-4 py-3 transition hover:bg-surface-2 ${className}`}>
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        <input
          className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-foreground/50 focus:outline-none"
          placeholder={placeholder}
        />
      </div>
    </label>
  );
}

function Chip({ children, icon: Icon }: { children: React.ReactNode; icon?: any }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-muted-foreground">
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}

const providers = ["Hertz", "Enterprise", "Avis", "Budget", "Sixt", "Alamo", "National", "Thrifty"];
function TrustedProviders() {
  return (
    <section className="border-y border-border bg-surface/30 py-10">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Trusted by leading providers across North America
        </p>
        <div className="mt-6 grid grid-cols-2 items-center gap-x-8 gap-y-6 sm:grid-cols-4 md:grid-cols-8">
          {providers.map((p) => (
            <div key={p} className="text-center text-lg font-semibold tracking-tight text-foreground/40 transition hover:text-foreground/80">
              {p}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const cats = [
  { name: "SUV", from: 64, img: suvImg, count: "2.1k vehicles" },
  { name: "Sedan", from: 39, img: sedanImg, count: "3.8k vehicles" },
  { name: "Sports", from: 129, img: sportsImg, count: "420 vehicles" },
  { name: "Electric", from: 79, img: evImg, count: "980 vehicles" },
];

function Categories() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader
        eyebrow="Marketplace"
        title="Popular vehicle categories"
        subtitle="Verified vehicles from premium providers, instantly bookable."
      />
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {cats.map((c) => (
          <Link
            key={c.name}
            to="/search"
            className="group relative overflow-hidden rounded-xl border border-border bg-surface transition hover:border-border-strong hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/40"
          >
            <div className="aspect-[16/10] overflow-hidden bg-surface-2">
              <img
                src={c.img}
                alt={c.name}
                width={1024}
                height={640}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <div className="text-base font-semibold text-foreground">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.count}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">From</div>
                <div className="text-sm font-semibold text-primary">${c.from}/day</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</span>
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-pretty text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

const benefits = [
  { icon: Headphones, title: "Assisted booking", desc: "Live agent support from search to pickup, in under 30 seconds." },
  { icon: TrendingUp, title: "Best pricing", desc: "Auto-matched against 12 marketplaces for the lowest verified rate." },
  { icon: ShieldCheck, title: "Verified providers", desc: "Every fleet partner audited for fleet quality, insurance and SLA." },
  { icon: Phone, title: "24/7 support", desc: "Cloud telephony backed support with under 12s avg pickup time." },
  { icon: Plane, title: "Airport rentals", desc: "Operating in 142 airports across the USA and Canada." },
  { icon: Shield, title: "Fully insured", desc: "Premium coverage and roadside assistance included on every trip." },
];

function WhyChoose() {
  return (
    <section className="border-y border-border bg-surface/30 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader eyebrow="Why RentOps" title="Built for trust at marketplace scale" />
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title} className="bg-surface p-7 transition hover:bg-surface-2">
              <div className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-surface-2 text-primary">
                <b.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-base font-semibold text-foreground">{b.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OperationalIntel() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Operational intelligence</span>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-foreground">
            AI-assisted matching across a live provider network.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every inbound lead is routed by intent, geography, urgency and budget — then matched in real time to the highest-rated provider with available inventory.
          </p>
          <ul className="mt-8 space-y-3.5">
            {[
              "Smart lead scoring with conversion probability",
              "Live inventory sync across 40+ providers",
              "Real-time call routing & whisper coaching",
              "Provider SLA scoring and auto-failover",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-sm text-foreground/90">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {t}
              </li>
            ))}
          </ul>
          <Link
            to="/app"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Explore the platform
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="relative">
          <div className="absolute -inset-8 -z-10 bg-[radial-gradient(circle_at_50%_50%,oklch(0.55_0.21_263/0.18),transparent_60%)]" />
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" /> Live network
              </div>
              <span className="text-xs text-muted-foreground">42 providers · 18,420 vehicles</span>
            </div>
            <div className="relative mt-6 h-64 overflow-hidden rounded-lg border border-border bg-surface-2">
              <div className="grid-bg absolute inset-0 opacity-50" />
              {[
                { x: 18, y: 30, l: "Toronto" },
                { x: 28, y: 55, l: "NYC" },
                { x: 22, y: 70, l: "Atlanta" },
                { x: 50, y: 45, l: "Chicago" },
                { x: 72, y: 35, l: "Denver" },
                { x: 84, y: 60, l: "LA" },
                { x: 65, y: 78, l: "Houston" },
                { x: 90, y: 25, l: "Seattle" },
              ].map((p) => (
                <div key={p.l} className="absolute" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                  <span className="absolute -inset-3 rounded-full bg-primary/20 pulse-dot" />
                  <span className="relative block h-2 w-2 rounded-full bg-primary" />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-medium text-foreground/80">{p.l}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                ["12s", "Avg match"],
                ["98.4%", "Fill rate"],
                ["4.92★", "Provider score"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-lg border border-border bg-surface-2 p-3">
                  <div className="text-base font-semibold text-foreground">{v}</div>
                  <div className="text-[11px] text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const quotes = [
  { q: "RentOps cut our booking time in half. The assisted experience feels Apple-level.", n: "Sarah Chen", r: "Director of Ops, Wayfarer" },
  { q: "Best provider matching we've used. Conversion is up 32% in our first quarter.", n: "Marcus Reid", r: "Head of Sales, Northwind" },
  { q: "It's like Stripe for car rentals — every dashboard is just where you'd expect it.", n: "Priya Shah", r: "GM, GreenLeaf Mobility" },
];

function Testimonials() {
  return (
    <section className="border-y border-border bg-surface/30 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader eyebrow="Customers" title="Trusted by operators across the continent" />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {quotes.map((q) => (
            <figure key={q.n} className="rounded-xl border border-border bg-surface p-6">
              <div className="flex gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-foreground/90">"{q.q}"</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-foreground">
                  {q.n.split(" ").map((w) => w[0]).join("")}
                </span>
                <div>
                  <div className="text-sm font-medium text-foreground">{q.n}</div>
                  <div className="text-xs text-muted-foreground">{q.r}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader eyebrow="Operations CRM" title="Run live sales operations in one console" subtitle="Pipeline, telephony, payments and analytics — beautifully unified." />
      <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/40">
        <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
          <span className="ml-3 text-xs text-muted-foreground">app.rentops.io / dashboard</span>
        </div>
        <div className="grid grid-cols-12 gap-px bg-border">
          <div className="col-span-3 hidden bg-surface p-4 lg:block">
            {["Dashboard", "Leads", "Calls", "Bookings", "Providers", "Analytics", "Payments"].map((i, idx) => (
              <div
                key={i}
                className={`mb-1 flex items-center gap-2 rounded-md px-2.5 py-2 text-xs ${
                  idx === 0 ? "bg-surface-2 font-medium text-foreground" : "text-muted-foreground"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" /> {i}
              </div>
            ))}
          </div>
          <div className="col-span-12 bg-surface p-6 lg:col-span-9">
            <div className="grid gap-3 md:grid-cols-4">
              {[
                ["Total leads", "4,238", "+12.4%", true],
                ["Active calls", "27", "Live", true],
                ["Revenue", "$284k", "+8.2%", true],
                ["Conversion", "34.6%", "+2.1%", true],
              ].map(([l, v, d]) => (
                <div key={l as string} className="rounded-lg border border-border bg-surface-2 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</div>
                  <div className="mt-1 text-xl font-semibold text-foreground">{v}</div>
                  <div className="text-[11px] text-success">{d}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid h-56 grid-cols-7 items-end gap-2 rounded-lg border border-border bg-surface-2 p-4">
              {[42, 65, 48, 78, 92, 70, 88].map((h, i) => (
                <div key={i} className="relative flex h-full flex-col items-center justify-end">
                  <div
                    className="w-full rounded-md bg-gradient-to-t from-primary/70 to-primary"
                    style={{ height: `${h}%` }}
                  />
                  <span className="mt-2 text-[10px] text-muted-foreground">{["M","T","W","T","F","S","S"][i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTAFooter() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-10 md:p-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,oklch(0.86_0.17_92/0.15),transparent_60%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_left,oklch(0.55_0.21_263/0.18),transparent_60%)]" />
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Ready to ship the operational layer for your rental business?
            </h2>
            <p className="mt-3 text-muted-foreground">Try the platform free for 14 days. No card required.</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Link to="/search" className="rounded-lg border border-border bg-surface-2 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent">
              Book a vehicle
            </Link>
            <Link to="/app" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
              <Activity className="h-4 w-4" /> Open dashboard
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
