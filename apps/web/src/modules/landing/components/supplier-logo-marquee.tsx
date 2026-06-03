"use client";

import { useState } from "react";
import type { MarketplaceSupplier } from "@/lib/marketplace/types";

type SupplierLogoMarqueeProps = {
  suppliers: MarketplaceSupplier[];
  variant?: "hero" | "section";
  /** Hero only: inline above copy on mobile; bottom strip on desktop. */
  heroPlacement?: "bottom" | "inline";
  className?: string;
};

function buildMarqueeLoop(suppliers: MarketplaceSupplier[], minTiles = 10): MarketplaceSupplier[] {
  if (suppliers.length === 0) return [];
  const expanded: MarketplaceSupplier[] = [];
  while (expanded.length < minTiles) {
    expanded.push(...suppliers);
  }
  return expanded;
}

function SupplierLogoContent({
  supplier,
  variant,
}: {
  supplier: MarketplaceSupplier;
  variant: "hero" | "section";
}) {
  const [failed, setFailed] = useState(false);
  const textClass =
    variant === "hero"
      ? "font-display text-xs font-bold tracking-tight text-white"
      : "font-display text-[11px] font-bold uppercase tracking-wide text-navy md:text-xs";

  if (!supplier.logo_url || failed) {
    return <span className={textClass}>{supplier.name}</span>;
  }

  return (
    <img
      src={supplier.logo_url}
      alt={supplier.name}
      className={
        variant === "hero"
          ? "max-h-8 max-w-[6.5rem] object-contain object-center md:max-h-9 md:max-w-[7rem]"
          : "max-h-7 max-w-[5.75rem] object-contain object-center md:max-h-8 md:max-w-[6.25rem]"
      }
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

function MarqueeTrack({
  suppliers,
  variant,
  keyPrefix,
}: {
  suppliers: MarketplaceSupplier[];
  variant: "hero" | "section";
  keyPrefix: string;
}) {
  if (variant === "hero") {
    return (
      <>
        {suppliers.map((supplier, index) => (
          <div
            key={`${keyPrefix}-${supplier.id}-${index}`}
            className="flex h-10 shrink-0 items-center justify-center px-1 md:h-11"
          >
            <SupplierLogoContent supplier={supplier} variant="hero" />
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {suppliers.map((supplier, index) => (
        <div
          key={`${keyPrefix}-${supplier.id}-${index}`}
          id={keyPrefix === "a" && index === 0 ? `suppliers-${supplier.slug}` : undefined}
          className="supplier-logo flex h-12 w-[7.25rem] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white px-2.5 py-2 shadow-card md:h-12 md:w-[7.75rem]"
        >
          <SupplierLogoContent supplier={supplier} variant="section" />
        </div>
      ))}
    </>
  );
}

export function SupplierLogoMarquee({
  suppliers,
  variant = "section",
  heroPlacement = "bottom",
  className = "",
}: SupplierLogoMarqueeProps) {
  if (suppliers.length === 0) return null;

  const marqueeItems = buildMarqueeLoop(suppliers, variant === "hero" ? 12 : 10);
  const gapClass = variant === "hero" ? "gap-3 md:gap-4" : "gap-3 md:gap-3.5";

  if (variant === "hero") {
    const isInline = heroPlacement === "inline";

    return (
      <div
        className={
          isInline
            ? `relative z-10 mt-4 mb-1 md:hidden ${className}`
            : `pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden bg-gradient-to-t from-black/80 via-black/50 to-transparent px-0 pb-5 pt-14 md:block md:pb-6 md:pt-20 ${className}`
        }
        aria-label="Rental brands we compare"
      >
        <div className={isInline ? "w-full" : "container-page pointer-events-auto"}>
          <p
            className={
              isInline
                ? "mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70"
                : "mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-white/60 md:text-left"
            }
          >
            Compare top brands
          </p>
          <div className="logo-marquee relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
            <div
              className={`logo-marquee-track flex w-max flex-nowrap ${gapClass} animate-marquee-hero motion-reduce:animate-none`}
            >
              <MarqueeTrack suppliers={marqueeItems} variant="hero" keyPrefix="a" />
              <MarqueeTrack suppliers={marqueeItems} variant="hero" keyPrefix="b" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`logo-marquee relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] ${className}`}
      aria-label="Rental brands we compare"
    >
      <div
        className={`logo-marquee-track flex w-max flex-nowrap ${gapClass} animate-marquee motion-reduce:animate-none`}
      >
        <MarqueeTrack suppliers={marqueeItems} variant="section" keyPrefix="a" />
        <MarqueeTrack suppliers={marqueeItems} variant="section" keyPrefix="b" aria-hidden />
      </div>
    </div>
  );
}
