import Image from "next/image";
import { ShieldCheck, Sparkles } from "lucide-react";
import { DirectCallButton } from "../components/direct-call-button";
import { SearchForm } from "../components/search-form";
import heroImg from "../assets/hero.jpg";

type HeroSectionProps = {
  /** Marketing lead page: call CTA only, no search form. */
  leadMode?: boolean;
};

export function HeroSection({ leadMode = false }: HeroSectionProps) {
  return (
    <section className="relative isolate min-h-[88svh] overflow-hidden">
      <Image
        src={heroImg}
        alt="Luxury SUV on a scenic coastal road at golden hour"
        fill
        priority
        className="-z-10 object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 -z-10 bg-hero-fade" aria-hidden />

      <div className="container-page pb-10 pt-8 md:pb-16 md:pt-12">
        <div className="max-w-3xl text-brand-text">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur ring-1 ring-white/25">
            <Sparkles className="size-3.5 text-brand-accent" />
            Trusted by millions of travelers worldwide
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-balance md:text-6xl">
            Find your perfect car.
            <br className="hidden md:block" />
            Anywhere in the world.
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/85 md:text-lg">
            Compare 800+ rental suppliers across 30,000+ locations. Best price guarantee, secure
            booking, and 24/7 worldwide support.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/85">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-400" /> Best price guarantee
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-400" /> Free cancellation
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-400" /> Secure booking
            </span>
          </div>
        </div>

        <div className="mt-8 md:mt-10">
          {leadMode ? (
            <div id="search" className="max-w-md scroll-mt-24">
              <DirectCallButton variant="hero" sublabel="Free quote · Advisors available 24/7" />
              <p className="mt-3 text-sm leading-relaxed text-white/75">
                No forms — call to compare rates from 800+ suppliers and book with an expert.
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/65">
                <li>Avg. answer under 2 min</li>
                <li>·</li>
                <li>No booking fees</li>
                <li>·</li>
                <li>Best price guarantee</li>
              </ul>
            </div>
          ) : (
            <SearchForm />
          )}
        </div>
      </div>
    </section>
  );
}
