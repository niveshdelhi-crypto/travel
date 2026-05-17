import heroImg from "@/assets/hero.jpg";
import { SearchCard } from "./SearchCard";
import { ShieldCheck, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <img
        src={heroImg}
        alt="Coastal road at golden hour"
        width={1920}
        height={1080}
        fetchPriority="high"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-hero-fade" />

      <div className="container-page pt-14 pb-10 md:pt-24 md:pb-16">
        <div className="max-w-3xl text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur ring-1 ring-white/25">
            <Sparkles className="size-3.5" /> Trusted by millions of travelers
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl text-balance">
            Find your perfect car. <br className="hidden md:block" />
            Anywhere in the world.
          </h1>
          <p className="mt-4 max-w-xl text-base md:text-lg text-white/85">
            Compare 800+ rental suppliers across 190+ countries. Best price, free cancellation,
            no hidden fees.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/85">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-success" /> Best price guarantee</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-success" /> Free cancellation</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-success" /> 24/7 customer support</span>
          </div>
        </div>

        <div className="mt-8 md:mt-10">
          <SearchCard />
        </div>
      </div>
    </section>
  );
}
