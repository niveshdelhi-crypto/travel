"use client";

import { Phone } from "lucide-react";
import {
  formatDirectCallLabel,
  getDirectCallPhone,
  getDirectCallTelHref,
  isDirectCallConfigured,
} from "../lib/direct-call";

export function MobileCallStickyCta() {
  const configured = isDirectCallConfigured();
  const telHref = getDirectCallTelHref();
  const phone = getDirectCallPhone();

  if (!configured || !telHref) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-brand-dark/95 p-3 backdrop-blur-md md:hidden">
        <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-3.5 text-xs text-brand-muted">
          <Phone className="size-4 shrink-0" />
          Add call number in env
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-brand-dark/95 p-3 backdrop-blur-md md:hidden">
      <a
        href={telHref}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-semibold text-white shadow-cta hover:bg-emerald-500"
      >
        <Phone className="size-4" />
        Call now · {formatDirectCallLabel(phone!)}
      </a>
    </div>
  );
}
