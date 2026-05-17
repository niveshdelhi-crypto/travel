import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { ArrowUpRight } from "lucide-react";

const destinations = [
  {
    name: "Dubai",
    country: "UAE",
    href: "/cars/uae",
    img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=900&q=80&auto=format&fit=crop",
  },
  {
    name: "London",
    country: "United Kingdom",
    href: "/cars/uk",
    img: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=900&q=80&auto=format&fit=crop",
  },
  {
    name: "Barcelona",
    country: "Spain",
    href: "/cars/spain",
    img: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=900&q=80&auto=format&fit=crop",
  },
  {
    name: "New York",
    country: "USA",
    href: "/cars/usa",
    img: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=900&q=80&auto=format&fit=crop",
  },
  {
    name: "Toronto",
    country: "Canada",
    href: "/cars/canada",
    img: "https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=900&q=80&auto=format&fit=crop",
  },
  {
    name: "Istanbul",
    country: "Türkiye",
    href: "/cars/turkey",
    img: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=900&q=80&auto=format&fit=crop",
  },
  {
    name: "Bangkok",
    country: "Thailand",
    href: "/cars/thailand",
    img: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=900&q=80&auto=format&fit=crop",
  },
  {
    name: "Rome",
    country: "Italy",
    href: "/cars/italy",
    img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=900&q=80&auto=format&fit=crop",
  },
];

export function DestinationsSection() {
  return (
    <section className="bg-surface-muted py-16 md:py-24">
      <div className="container-page">
        <div className="flex items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
              Popular destinations
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Where will you drive next?
            </h2>
          </div>
          <Link
            href={"/contact" as Route}
            className="hidden items-center gap-1 text-sm font-semibold text-brand-primary hover:underline md:inline-flex"
          >
            Contact for more <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {destinations.map((d, i) => (
            <Link
              key={d.name}
              href={d.href as Route}
              className={`group relative overflow-hidden rounded-2xl shadow-card ${
                i === 0 ? "col-span-2 row-span-2 aspect-square lg:aspect-auto" : "aspect-[4/5]"
              }`}
            >
              <Image
                src={d.img}
                alt={d.name}
                fill
                sizes={i === 0 ? "(max-width:768px) 100vw, 50vw" : "(max-width:768px) 50vw, 25vw"}
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white md:p-5">
                <p className="text-xs font-medium text-white/80">{d.country}</p>
                <h3 className="mt-0.5 font-display text-xl font-bold tracking-tight md:text-2xl">
                  {d.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
