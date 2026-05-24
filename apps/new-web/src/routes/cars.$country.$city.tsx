import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SearchCard } from "@/components/site/SearchCard";
import { ChevronRight } from "lucide-react";

const pretty = (s: string) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const Route = createFileRoute("/cars/$country/$city")({
  head: ({ params }) => {
    const city = pretty(params.city);
    const country = pretty(params.country);
    return {
      meta: [
        { title: `Car rental ${city}, ${country} | Book my Carz` },
        { name: "description", content: `Cheap car rental deals in ${city}, ${country}. Compare 800+ suppliers — best price, free cancellation.` },
        { property: "og:url", content: `/cars/${params.country}/${params.city}` },
      ],
      links: [{ rel: "canonical", href: `/cars/${params.country}/${params.city}` }],
    };
  },
  component: CityPage,
});

function CityPage() {
  const { country, city } = Route.useParams();
  const cityName = pretty(city);
  const countryName = pretty(country);
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <section className="bg-navy py-14 md:py-20 text-navy-foreground">
        <div className="container-page">
          <nav className="flex items-center gap-1 text-xs text-white/70">
            <Link to="/" className="hover:text-white">Home</Link>
            <ChevronRight className="size-3" />
            <Link to={`/cars/${country}` as string} className="hover:text-white">{countryName}</Link>
            <ChevronRight className="size-3" />
            <span>{cityName}</span>
          </nav>
          <h1 className="mt-4 font-display text-3xl md:text-5xl font-bold tracking-tight">
            Car rental in {cityName}
          </h1>
          <p className="mt-3 max-w-2xl text-white/80">
            Compare deals from top suppliers in {cityName}. Free cancellation. Pickup at airport or city center.
          </p>
          <div className="mt-8"><SearchCard compact /></div>
        </div>
      </section>
      <main className="flex-1 container-page py-14">
        <h2 className="font-display text-2xl font-bold text-foreground">About car rental in {cityName}</h2>
        <p className="mt-4 max-w-3xl text-foreground/80 leading-relaxed">
          {cityName} is one of the most popular rental destinations in {countryName}. Whether
          you're flying in for business or exploring the region by road, Book my Carz compares
          live availability across hundreds of suppliers so you always get the best deal.
        </p>
      </main>
      <Footer />
    </div>
  );
}
