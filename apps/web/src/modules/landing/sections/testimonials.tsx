import Image from "next/image";
import { BadgeCheck, Star } from "lucide-react";

const reviews = [
  {
    name: "Sarah Mitchell",
    country: "United Kingdom",
    rating: 5,
    text: "Booked an SUV in Dubai in under 2 minutes. Pickup at DXB was seamless and the price beat every comparison site I tried.",
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80&auto=format&fit=crop",
  },
  {
    name: "Daniel Ortega",
    country: "Spain",
    rating: 5,
    text: "Free cancellation saved me when plans changed. Refund hit my card the next morning. Will use FleetNexus again.",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80&auto=format&fit=crop",
  },
  {
    name: "Aiko Tanaka",
    country: "Japan",
    rating: 4,
    text: "Excellent supplier choice in Barcelona. The filters are super clear — found a hybrid in seconds.",
    img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80&auto=format&fit=crop",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container-page">
        <div className="flex items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">Reviews</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Loved by travelers in 190+ countries
            </h2>
          </div>
          <div className="hidden items-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 shadow-card md:flex">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-4 fill-brand-primary text-brand-primary" />
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">4.8 / 5</p>
              <p className="text-xs text-muted-foreground">Based on verified reviews</p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.name} className="rounded-2xl border border-border bg-white p-6 shadow-card">
              <div className="flex items-center gap-3">
                <Image
                  src={r.img}
                  alt={r.name}
                  width={48}
                  height={48}
                  className="size-12 rounded-full object-cover"
                />
                <figcaption>
                  <p className="flex items-center gap-1.5 font-semibold text-foreground">
                    {r.name}
                    <BadgeCheck className="size-4 text-brand-primary" />
                  </p>
                  <p className="text-xs text-muted-foreground">{r.country}</p>
                </figcaption>
              </div>
              <div className="mt-4 flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-4 ${i < r.rating ? "fill-brand-primary text-brand-primary" : "text-border"}`}
                  />
                ))}
              </div>
              <blockquote className="mt-3 text-sm leading-relaxed text-foreground/80">
                &ldquo;{r.text}&rdquo;
              </blockquote>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
