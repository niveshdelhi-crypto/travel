import type { MarketplaceSupplier } from "@/lib/marketplace/types";

type SupplierLogoMarqueeProps = {
  suppliers: MarketplaceSupplier[];
  variant?: "hero" | "section";
  /** Hero only: inline above copy on mobile; bottom strip on desktop. */
  heroPlacement?: "bottom" | "inline";
  className?: string;
};
/** Expand supplier list so the strip fills wide viewports before duplicating for the loop. */
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
  if (supplier.logo_url) {
    return (
      // Admin-managed URLs may come from any host; plain img avoids Next image domain config.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={supplier.logo_url}
        alt={supplier.name}
        className={
          variant === "hero"
            ? "h-6 max-w-[96px] object-contain"
            : "h-10 max-w-[128px] object-contain"
        }
        loading="lazy"
        draggable={false}
      />
    );
  }

  return (
    <span
      className={
        variant === "hero"
          ? "font-display text-sm font-bold tracking-tight text-navy"
          : "font-display text-lg font-bold tracking-tight text-navy"
      }
    >
      {supplier.name}
    </span>
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
            className="flex h-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/95 px-5 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.45)] backdrop-blur-sm md:h-12 md:px-6"
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
          className="supplier-logo flex h-20 w-44 shrink-0 items-center justify-center rounded-2xl border border-border bg-white px-4 shadow-card"
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
  const gapClass = variant === "hero" ? "gap-3 md:gap-4" : "gap-4";

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
