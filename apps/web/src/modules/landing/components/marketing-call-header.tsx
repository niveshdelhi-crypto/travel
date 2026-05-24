import Link from "next/link";
import { DirectCallButton } from "./direct-call-button";

/** Minimal header for paid marketing / lead landing pages — logo + call CTA only. */
export function MarketingCallHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-brand-dark/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/call" className="flex shrink-0 items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary font-display text-sm font-bold text-white">
            B
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-brand-text">
            Book my <span className="text-brand-accent">Carz</span>
          </span>
        </Link>

        <div className="flex min-w-0 flex-1 justify-end pl-2">
          <DirectCallButton variant="header" className="shrink-0" />
        </div>
      </div>
    </header>
  );
}
