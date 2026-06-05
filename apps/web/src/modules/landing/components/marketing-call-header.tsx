import { BrandLogo } from "@/components/brand/brand-logo";
import { BRAND_NAVBAR_HEIGHT_CLASS } from "@/lib/brand";
import { DirectCallButton } from "./direct-call-button";

/** Minimal header for paid marketing / lead landing pages — logo + call CTA only. */
export function MarketingCallHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-brand-dark/90 backdrop-blur-md">
      <div
        className={`container-page flex ${BRAND_NAVBAR_HEIGHT_CLASS} items-center justify-between gap-3 sm:gap-4`}
      >
        <BrandLogo href="/call" size="nav" priority />

        <div className="flex min-w-0 flex-1 justify-end pl-1 sm:pl-2">
          <DirectCallButton variant="header" className="shrink-0" />
        </div>
      </div>
    </header>
  );
}
