import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

// Real city photos served from Unsplash CDN (free, hotlinkable, no API key).
const destinations = [
  { name: "Dubai", country: "UAE", cars: 1240, from: 19, href: "/cars/uae/dubai",
    img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=900&q=80&auto=format&fit=crop" },
  { name: "London", country: "United Kingdom", cars: 980, from: 24, href: "/cars/uk/london",
    img: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=900&q=80&auto=format&fit=crop" },
  { name: "Barcelona", country: "Spain", cars: 760, from: 17, href: "/cars/spain/barcelona",
    img: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=900&q=80&auto=format&fit=crop" },
  { name: "New York", country: "USA", cars: 1430, from: 32, href: "/cars/usa/new-york",
    img: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=900&q=80&auto=format&fit=crop" },
  { name: "Toronto", country: "Canada", cars: 540, from: 28, href: "/cars/canada/toronto",
    img: "https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=900&q=80&auto=format&fit=crop" },
  { name: "Istanbul", country: "Türkiye", cars: 690, from: 14, href: "/cars/turkey/istanbul",
    img: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=900&q=80&auto=format&fit=crop" },
  { name: "Bangkok", country: "Thailand", cars: 470, from: 12, href: "/cars/thailand/bangkok",
    img: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=900&q=80&auto=format&fit=crop" },
  { name: "Rome", country: "Italy", cars: 820, from: 21, href: "/cars/italy/rome",
    img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=900&q=80&auto=format&fit=crop" },
];

export function Destinations() {
  return (
    <section className="bg-surface-muted py-16 md:py-24">
      <div className="container-page">
        <div className="flex items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Popular destinations</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Where will you drive next?
            </h2>
          </div>
          <Link to="/destinations" className="hidden md:inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
            All destinations <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {destinations.map((d, i) => (
            <Link
              key={d.name}
              to={d.href as string}
              className={`group relative overflow-hidden rounded-2xl shadow-card ${
                i === 0 ? "row-span-2 col-span-2 lg:row-span-2 lg:col-span-2 aspect-square lg:aspect-auto" : "aspect-[4/5]"
              }`}
            >
              <img
                src={d.img}
                alt={d.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 text-white">
                <div className="text-xs font-medium text-white/80">{d.country}</div>
                <div className="mt-0.5 flex items-end justify-between gap-2">
                  <h3 className="font-display text-xl md:text-2xl font-bold tracking-tight">{d.name}</h3>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-white/70">From</div>
                    <div className="font-display text-base font-bold">${d.from}/day</div>
                  </div>
                </div>
                <div className="mt-1 text-xs text-white/80">{d.cars.toLocaleString()} cars available</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
