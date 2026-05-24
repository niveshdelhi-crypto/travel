"use client";

import { DirectCallButton } from "./direct-call-button";

export function MobileCallStickyCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-brand-dark/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
      <DirectCallButton variant="sticky" />
    </div>
  );
}
