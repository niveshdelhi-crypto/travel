import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SearchCard } from "@/components/site/SearchCard";
import { ChevronRight, MapPin, Plane, Star } from "lucide-react";

export const Route = createFileRoute("/cars/$country")({
  head: ({ params }) => {
    const name = pretty(params.country);
    return {
      meta: [
        { title: `Car rental ${name} — Compare deals | MarkleTravelBooking` },
        { name: "description", content: `Compare cheap car rental deals in ${name} from 800+ suppliers. Free cancellation, best price guarantee, 24/7 support.` },
        { property: "og:title", content: `Car rental ${name} | MarkleTravelBooking` },
        { property: "og:url", content: `/cars/${params.country}` },
      ],
      links: [{ rel: "canonical", href: `/cars/${params.country}` }],
    };
  },
  component: CountryPage,
});

const pretty = (s: string) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const cities = [
  { slug: "dubai", name: "Dubai", count: 1240 },
  { slug: "abu-dhabi", name: "Abu Dhabi", count: 540 },
  { slug: "sharjah", name: "Sharjah", count: 320 },
];
const airports = [
  { slug: "dxb-airport", name: "Dubai International (DXB)" },
  { slug: "auh-airport", name: "Abu Dhabi (AUH)" },
];

function CountryPage() {
  const { country } = Route.useParams();
  const name = pretty(country);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <section className="relative bg-navy py-14 md:py-20 text-navy-foreground">
        <div className="container-page">
          <nav className="flex items-center gap-1 text-xs text-white/70">
            <Link to="/" className="hover:text-white">Home</Link>
            <ChevronRight className="size-3" />
            <span>Car rental {name}</span>
          </nav>
          <h1 className="mt-4 font-display text-3xl md:text-5xl font-bold tracking-tight max-w-3xl">
            Car rental in {name}
          </h1>
          <p className="mt-3 max-w-2xl text-white/80">
            Compare deals from 800+ suppliers. Free cancellation. No hidden fees.
          </p>
          <div className="mt-8"><SearchCard compact /></div>
        </div>
      </section>

      <main className="flex-1 container-page py-14">
        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          <div className="prose-section space-y-12">
            <Section title={`Popular cities in ${name}`}>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {cities.map((c) => (
                  <Link key={c.slug} to={`/cars/${country}/${c.slug}` as string} className="flex items-center justify-between rounded-2xl border border-border bg-white px-4 py-3 hover:border-accent hover:bg-accent/5 transition-colors">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground"><MapPin className="size-4 text-accent" />{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.count} cars</span>
                  </Link>
                ))}
              </div>
            </Section>

            <Section title={`Top airports in ${name}`}>
              <div className="grid gap-3 sm:grid-cols-2">
                {airports.map((a) => (
                  <Link key={a.slug} to={`/cars/${country}/${a.slug}` as string} className="flex items-center justify-between rounded-2xl border border-border bg-white px-4 py-3 hover:border-accent hover:bg-accent/5 transition-colors">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground"><Plane className="size-4 text-accent" />{a.name}</span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </Section>

            <Section title={`Travel tips for ${name}`}>
              <ul className="space-y-3 text-sm text-foreground/80 leading-relaxed">
                <li>• Drive on the right. Speed limits are clearly marked in km/h.</li>
                <li>• An International Driving Permit is recommended for non-residents.</li>
                <li>• Toll roads are common — most cars come with electronic toll devices.</li>
                <li>• Petrol stations are abundant in cities and along major motorways.</li>
              </ul>
            </Section>

            <Section title="Frequently asked questions">
              <Faq q={`How old do I need to be to rent a car in ${name}?`} a="Most suppliers require drivers to be 21 or older, with a valid license held for at least 1 year. Young driver fees may apply under 25." />
              <Faq q="Is insurance included?" a="Basic third-party insurance is included. You can add full coverage at checkout for total peace of mind." />
              <Faq q="Can I cancel for free?" a="Most rentals on MarkleTravelBooking offer free cancellation up to 48 hours before pickup." />
            </Section>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
              <h4 className="font-display font-semibold text-foreground">Featured suppliers</h4>
              <ul className="mt-3 space-y-2 text-sm">
                {["Hertz","Avis","Enterprise","Europcar","Sixt"].map((s) => (
                  <li key={s} className="flex items-center justify-between">
                    <span className="text-foreground/80">{s}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Star className="size-3 fill-cta text-cta" />4.{Math.floor(Math.random()*9)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-bold text-foreground">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl border border-border bg-white p-5 open:shadow-card">
      <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-foreground">
        {q}
        <ChevronRight className="size-4 transition-transform group-open:rotate-90 text-muted-foreground" />
      </summary>
      <p className="mt-3 text-sm text-foreground/75 leading-relaxed">{a}</p>
    </details>
  );
}
