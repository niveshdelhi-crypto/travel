import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { Badge } from "@/components/app/primitives";
import suvImg from "@/assets/car-suv.jpg";
import sedanImg from "@/assets/car-sedan.jpg";
import sportsImg from "@/assets/car-sports.jpg";
import evImg from "@/assets/car-ev.jpg";
import { Fuel, Users, Cog, MapPin, Star, Plane, Filter, Map } from "lucide-react";

export const Route = createFileRoute("/search")({
    component: SearchPage,
});

const cars = [
  { n: "Range Rover Sport", p: "Hertz", img: suvImg, price: 184, seats: 7, trans: "Auto", fuel: "Hybrid", rating: 4.9, tags: ["Airport", "Premium"] },
  { n: "BMW 5 Series", p: "Sixt", img: sedanImg, price: 119, seats: 5, trans: "Auto", fuel: "Petrol", rating: 4.8, tags: ["Business"] },
  { n: "Toyota GR86", p: "Enterprise", img: sportsImg, price: 149, seats: 4, trans: "Manual", fuel: "Petrol", rating: 4.7, tags: ["Sport"] },
  { n: "Tesla Model Y", p: "Avis", img: evImg, price: 129, seats: 5, trans: "Auto", fuel: "Electric", rating: 4.9, tags: ["EV", "Long range"] },
  { n: "Mercedes GLE", p: "Hertz", img: suvImg, price: 199, seats: 7, trans: "Auto", fuel: "Petrol", rating: 4.8, tags: ["Premium"] },
  { n: "Audi A6", p: "Sixt", img: sedanImg, price: 139, seats: 5, trans: "Auto", fuel: "Diesel", rating: 4.8, tags: ["Business"] },
];

function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="border-b border-border bg-surface/40 pt-20">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-4 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">JFK Airport, NY</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-foreground">May 12 → May 18</span>
          <Badge tone="primary"><Plane className="h-3 w-3" /> Airport pickup</Badge>
          <button className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-surface-2">Modify search</button>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-12">
        <aside className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-24 space-y-5 rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-foreground">Filters</h3><Filter className="h-3.5 w-3.5 text-muted-foreground" /></div>
            <FilterGroup title="Car type" options={["SUV", "Sedan", "Sports", "Electric", "Van"]} />
            <FilterGroup title="Transmission" options={["Auto", "Manual"]} />
            <FilterGroup title="Fuel" options={["Petrol", "Diesel", "Hybrid", "Electric"]} />
            <FilterGroup title="Provider" options={["Hertz", "Enterprise", "Sixt", "Avis", "Budget"]} />
            <div>
              <h4 className="mb-2 text-xs font-medium text-foreground">Price / day</h4>
              <input type="range" min={30} max={400} defaultValue={200} className="w-full accent-primary" />
              <div className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>$30</span><span>$400+</span></div>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-9">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">{cars.length * 47} vehicles available</h2>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-surface-2"><Map className="h-3.5 w-3.5" /> Show map</button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {cars.map((c) => (
              <article key={c.n} className="group overflow-hidden rounded-xl border border-border bg-surface transition hover:-translate-y-0.5 hover:border-border-strong hover:shadow-2xl hover:shadow-black/40">
                <div className="aspect-[16/10] overflow-hidden bg-surface-2">
                  <img src={c.img} alt={c.n} loading="lazy" width={1024} height={640} className="h-full w-full object-cover transition group-hover:scale-105" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-foreground">{c.n}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">{c.p} · <span className="inline-flex items-center gap-0.5 text-foreground"><Star className="h-3 w-3 fill-primary text-primary" /> {c.rating}</span></div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-foreground">${c.price}<span className="text-xs font-normal text-muted-foreground">/day</span></div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {c.seats}</span>
                    <span className="inline-flex items-center gap-1"><Cog className="h-3 w-3" /> {c.trans}</span>
                    <span className="inline-flex items-center gap-1"><Fuel className="h-3 w-3" /> {c.fuel}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">{c.tags.map((t) => <Badge key={t} tone="neutral">{t}</Badge>)}</div>
                  <div className="mt-4 flex items-center gap-2">
                    <button className="flex-1 rounded-md border border-border bg-surface-2 px-3 py-2 text-xs font-medium hover:bg-accent">Compare</button>
                    <Link to="/" className="flex-1 rounded-md bg-primary px-3 py-2 text-center text-xs font-semibold text-primary-foreground hover:opacity-90">Reserve</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

function FilterGroup({ title, options }: { title: string; options: string[] }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-medium text-foreground">{title}</h4>
      <ul className="space-y-1.5">
        {options.map((o) => (
          <li key={o}><label className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><input type="checkbox" className="accent-primary" /> {o}</label></li>
        ))}
      </ul>
    </div>
  );
}
