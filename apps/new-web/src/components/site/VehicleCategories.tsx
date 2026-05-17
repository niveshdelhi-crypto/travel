import { Users, Fuel, Cog, Zap } from "lucide-react";

const cars = [
  { cat: "Economy", price: 19, seats: 4, fuel: "Petrol", trans: "Manual",
    img: "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80&auto=format&fit=crop" },
  { cat: "SUV", price: 42, seats: 5, fuel: "Petrol", trans: "Auto",
    img: "https://images.unsplash.com/photo-1519440099050-1c81b3a76e25?w=800&q=80&auto=format&fit=crop" },
  { cat: "Luxury", price: 89, seats: 4, fuel: "Petrol", trans: "Auto",
    img: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80&auto=format&fit=crop" },
  { cat: "Convertible", price: 76, seats: 4, fuel: "Petrol", trans: "Auto",
    img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop" },
  { cat: "Van", price: 54, seats: 9, fuel: "Diesel", trans: "Manual",
    img: "https://images.unsplash.com/photo-1609520505218-7421df17ea05?w=800&q=80&auto=format&fit=crop" },
  { cat: "Premium", price: 65, seats: 5, fuel: "Hybrid", trans: "Auto",
    img: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80&auto=format&fit=crop" },
];

export function VehicleCategories() {
  return (
    <section className="py-16 md:py-24">
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Vehicle categories</p>
          <h2 className="mt-2 font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            From economy to exotic — book any class
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cars.map((c) => (
            <article key={c.cat} className="group overflow-hidden rounded-2xl border border-border bg-white shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated">
              <div className="relative aspect-[16/10] overflow-hidden bg-surface-muted">
                <img src={c.img} alt={c.cat} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-success/95 px-2.5 py-1 text-[11px] font-semibold text-success-foreground shadow">
                  <Zap className="size-3" /> Instant booking
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">{c.cat}</h3>
                    <div className="text-xs text-muted-foreground">or similar</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl font-bold text-foreground leading-none">${c.price}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">per day</div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {c.seats} seats</span>
                  <span className="inline-flex items-center gap-1"><Cog className="size-3.5" /> {c.trans}</span>
                  <span className="inline-flex items-center gap-1"><Fuel className="size-3.5" /> {c.fuel}</span>
                </div>
                <button className="mt-5 w-full rounded-xl bg-navy py-2.5 text-sm font-semibold text-navy-foreground transition-colors hover:bg-navy/90">
                  View deals
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
