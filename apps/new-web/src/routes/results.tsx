import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SearchCard } from "@/components/site/SearchCard";
import { Users, Cog, Fuel, Zap, ShieldCheck, Filter } from "lucide-react";
import { useState } from "react";

type Search = {
  pickupLocation?: string;
  dropoffLocation?: string;
  pickupDate?: string;
  returnDate?: string;
};

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Search results — FleetNexus" },
      { name: "description", content: "Compare car rental deals from top suppliers near you." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    pickupLocation: typeof s.pickupLocation === "string" ? s.pickupLocation : "",
    dropoffLocation: typeof s.dropoffLocation === "string" ? s.dropoffLocation : "",
    pickupDate: typeof s.pickupDate === "string" ? s.pickupDate : "",
    returnDate: typeof s.returnDate === "string" ? s.returnDate : "",
  }),
  component: ResultsPage,
});

const sampleCars = [
  { id: 1, name: "Toyota Corolla", cat: "Economy", supplier: "Hertz", price: 24, taxes: 7, seats: 5, trans: "Auto", fuel: "Petrol", cancel: true,
    img: "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80&auto=format&fit=crop" },
  { id: 2, name: "Nissan Qashqai", cat: "SUV", supplier: "Avis", price: 42, taxes: 11, seats: 5, trans: "Auto", fuel: "Petrol", cancel: true,
    img: "https://images.unsplash.com/photo-1519440099050-1c81b3a76e25?w=800&q=80&auto=format&fit=crop" },
  { id: 3, name: "BMW 5 Series", cat: "Luxury", supplier: "Sixt", price: 89, taxes: 18, seats: 5, trans: "Auto", fuel: "Petrol", cancel: false,
    img: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80&auto=format&fit=crop" },
  { id: 4, name: "Mazda MX-5", cat: "Convertible", supplier: "Enterprise", price: 76, taxes: 14, seats: 2, trans: "Manual", fuel: "Petrol", cancel: true,
    img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop" },
  { id: 5, name: "Ford Transit", cat: "Van", supplier: "Budget", price: 54, taxes: 12, seats: 9, trans: "Manual", fuel: "Diesel", cancel: true,
    img: "https://images.unsplash.com/photo-1609520505218-7421df17ea05?w=800&q=80&auto=format&fit=crop" },
  { id: 6, name: "Toyota Camry Hybrid", cat: "Premium", supplier: "Europcar", price: 65, taxes: 13, seats: 5, trans: "Auto", fuel: "Hybrid", cancel: true,
    img: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80&auto=format&fit=crop" },
];

function ResultsPage() {
  const s = Route.useSearch();
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="bg-navy py-8 md:py-10">
        <div className="container-page">
          <nav className="text-xs text-white/70 mb-4">
            <Link to="/" className="hover:text-white">Home</Link> <span className="mx-1">/</span> <span className="text-white">Results</span>
          </nav>
          <SearchCard compact />
        </div>
      </div>

      <main className="flex-1 container-page py-8 md:py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              {s.pickupLocation || "Available rentals"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {sampleCars.length} cars found · {s.pickupDate} → {s.returnDate}
            </p>
          </div>
          <button onClick={() => setFiltersOpen((v) => !v)} className="lg:hidden inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium">
            <Filter className="size-4" /> Filters
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className={`${filtersOpen ? "block" : "hidden"} lg:block`}>
            <div className="rounded-2xl border border-border bg-white p-5 shadow-card sticky top-20">
              <h3 className="font-display font-semibold text-foreground">Filters</h3>

              <FilterBlock title="Price per day">
                <input type="range" min={10} max={200} defaultValue={120} className="w-full accent-[var(--cta)]" />
                <div className="flex justify-between text-xs text-muted-foreground"><span>$10</span><span>$200+</span></div>
              </FilterBlock>

              <FilterBlock title="Supplier">
                {["Hertz","Avis","Enterprise","Budget","Sixt","Europcar"].map((x) => (
                  <CheckRow key={x} label={x} />
                ))}
              </FilterBlock>

              <FilterBlock title="Transmission">
                {["Automatic","Manual"].map((x) => <CheckRow key={x} label={x} />)}
              </FilterBlock>

              <FilterBlock title="Seats">
                {["2","4","5","7","9+"].map((x) => <CheckRow key={x} label={`${x} seats`} />)}
              </FilterBlock>

              <FilterBlock title="Fuel">
                {["Petrol","Diesel","Hybrid","Electric"].map((x) => <CheckRow key={x} label={x} />)}
              </FilterBlock>

              <FilterBlock title="Policies">
                <CheckRow label="Free cancellation" />
                <CheckRow label="Unlimited mileage" />
              </FilterBlock>
            </div>
          </aside>

          <div className="space-y-4">
            {sampleCars.map((c) => (
              <article key={c.id} className="rounded-2xl border border-border bg-white p-4 md:p-5 shadow-card transition-shadow hover:shadow-elevated">
                <div className="grid gap-5 md:grid-cols-[220px_1fr_180px]">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl bg-surface-muted">
                    <img src={c.img} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{c.cat} · or similar</div>
                    <h3 className="font-display text-lg font-bold text-foreground">{c.name}</h3>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-navy">
                      {c.supplier}
                    </div>
                    <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                      <li className="inline-flex items-center gap-1"><Users className="size-3.5" />{c.seats}</li>
                      <li className="inline-flex items-center gap-1"><Cog className="size-3.5" />{c.trans}</li>
                      <li className="inline-flex items-center gap-1"><Fuel className="size-3.5" />{c.fuel}</li>
                      <li className="inline-flex items-center gap-1"><Zap className="size-3.5" />Instant</li>
                    </ul>
                    {c.cancel && (
                      <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-success">
                        <ShieldCheck className="size-4" /> Free cancellation
                      </div>
                    )}
                  </div>
                  <div className="flex md:flex-col items-end md:items-stretch justify-between gap-3">
                    <div className="text-right">
                      <div className="font-display text-2xl font-bold text-foreground leading-none">${c.price}</div>
                      <div className="text-[11px] text-muted-foreground">per day · +${c.taxes} taxes</div>
                    </div>
                    <button className="rounded-xl bg-cta px-5 py-2.5 text-sm font-semibold text-cta-foreground shadow-cta transition-transform hover:-translate-y-0.5">
                      Book now
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 border-t border-border pt-4 first:border-0 first:pt-0 first:mt-4">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}
function CheckRow({ label }: { label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm text-foreground/80">
      <input type="checkbox" className="size-4 rounded border-border accent-[var(--accent)]" />
      {label}
    </label>
  );
}
