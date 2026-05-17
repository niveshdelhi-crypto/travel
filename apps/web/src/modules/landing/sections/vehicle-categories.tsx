import Image from "next/image";
import Link from "next/link";
import { Cog, Fuel, Users, Zap } from "lucide-react";
import economyImg from "../assets/categories/economy.jpg";
import suvImg from "../assets/categories/suv.jpg";
import luxuryImg from "../assets/categories/luxury.jpg";
import convertibleImg from "../assets/categories/convertible.jpg";
import vanImg from "../assets/categories/van.jpg";
import premiumImg from "../assets/categories/premium.jpg";

const cars = [
  {
    cat: "Economy",
    seats: 4,
    fuel: "Petrol",
    trans: "Manual",
    img: economyImg,
    alt: "Compact economy hatchback",
  },
  {
    cat: "SUV",
    seats: 5,
    fuel: "Petrol",
    trans: "Auto",
    img: suvImg,
    alt: "Full-size SUV",
  },
  {
    cat: "Luxury",
    seats: 4,
    fuel: "Petrol",
    trans: "Auto",
    img: luxuryImg,
    alt: "Luxury performance sedan",
  },
  {
    cat: "Convertible",
    seats: 4,
    fuel: "Petrol",
    trans: "Auto",
    img: convertibleImg,
    alt: "Convertible sports car with top down",
  },
  {
    cat: "Van",
    seats: 9,
    fuel: "Diesel",
    trans: "Manual",
    img: vanImg,
    alt: "Passenger minivan",
  },
  {
    cat: "Premium",
    seats: 5,
    fuel: "Hybrid",
    trans: "Auto",
    img: premiumImg,
    alt: "Premium coupe",
  },
];

export function VehicleCategoriesSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
            Vehicle categories
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            From economy to luxury — book any class
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cars.map((c) => (
            <article
              key={c.cat}
              className="group overflow-hidden rounded-2xl border border-border bg-white shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-surface-muted">
                <Image
                  src={c.img}
                  alt={c.alt}
                  fill
                  sizes="(max-width:768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-[11px] font-semibold text-success-foreground shadow">
                  <Zap className="size-3" /> Search available
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg font-bold text-foreground">{c.cat}</h3>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5" /> {c.seats} seats
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Cog className="size-3.5" /> {c.trans}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Fuel className="size-3.5" /> {c.fuel}
                  </span>
                </div>
                <Link
                  href="/#search"
                  className="mt-5 flex w-full items-center justify-center rounded-xl bg-navy py-2.5 text-sm font-semibold text-navy-foreground transition-colors hover:bg-navy/90"
                >
                  Search {c.cat}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
