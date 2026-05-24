"use client";

import { Headphones, Phone } from "lucide-react";
import {
  formatDirectCallLabel,
  getDirectCallPhone,
  getDirectCallTelHref,
  isDirectCallConfigured,
} from "../lib/direct-call";

type DirectCallButtonProps = {
  variant?: "primary" | "outline" | "header" | "hero" | "sticky";
  className?: string;
  /** Shown under the number on hero / sticky variants */
  sublabel?: string;
};

export function DirectCallButton({
  variant = "outline",
  className = "",
  sublabel,
}: DirectCallButtonProps) {
  const phone = getDirectCallPhone();
  const telHref = getDirectCallTelHref();
  const configured = isDirectCallConfigured();
  const displayNumber = phone ? formatDirectCallLabel(phone) : "";

  const isOutline = variant === "outline";
  const isHeader = variant === "header";
  const isHero = variant === "hero";
  const isSticky = variant === "sticky";
  const isPrimary = variant === "primary";

  if (!configured) {
    return <CallButtonPlaceholder variant={variant} className={className} />;
  }

  if (isHero) {
    return (
      <a
        href={telHref!}
        aria-label={`Call now at ${displayNumber}`}
        className={`group inline-flex max-w-full items-center gap-3 rounded-xl bg-brand-primary px-4 py-3 text-white shadow-cta ring-1 ring-white/20 transition hover:brightness-110 active:scale-[0.99] sm:px-5 sm:py-3.5 ${className}`}
      >
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/15"
          aria-hidden
        >
          <Phone className="size-5" strokeWidth={2.25} />
        </span>
        <span className="min-w-0 text-left leading-snug">
          <span className="block text-xs font-medium text-white/90">
            {sublabel ?? "Speak with a rental advisor"}
          </span>
          <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0">
            <span className="text-base font-semibold sm:text-lg">Call now</span>
            <span className="font-mono text-sm font-medium text-white/95 sm:text-base">
              {displayNumber}
            </span>
          </span>
        </span>
      </a>
    );
  }

  if (isSticky) {
    return (
      <a
        href={telHref!}
        aria-label={`Call now at ${displayNumber}`}
        className={`flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white shadow-cta transition hover:brightness-110 active:scale-[0.99] ${className}`}
      >
        <Phone className="size-4 shrink-0" strokeWidth={2.5} />
        <span>Call now</span>
        <span className="font-mono text-white/90">{displayNumber}</span>
      </a>
    );
  }

  if (isHeader) {
    return (
      <a
        href={telHref!}
        aria-label={`Call now at ${displayNumber}`}
        className={`inline-flex max-w-full items-center gap-2 rounded-full bg-brand-primary px-3.5 py-2 text-sm font-semibold text-white shadow-cta transition hover:brightness-110 active:scale-[0.98] sm:px-4 ${className}`}
      >
        <Phone className="size-4 shrink-0" strokeWidth={2.5} />
        <span className="hidden sm:inline">Call</span>
        <span className="font-mono text-xs sm:text-sm">{displayNumber}</span>
      </a>
    );
  }

  const baseClass = `flex cursor-pointer items-center justify-center gap-2.5 font-semibold transition duration-200 active:scale-[0.99] w-full rounded-xl px-4 py-3.5 text-sm ${className}`;

  return (
    <a
      href={telHref!}
      aria-label={`Call us at ${displayNumber}`}
      className={`${baseClass} ${
        isOutline
          ? "border-2 border-brand-primary/50 bg-brand-primary/10 text-brand-text hover:border-brand-primary hover:bg-brand-primary/20"
          : "bg-gradient-to-r from-brand-primary to-[#ff8f1f] text-white shadow-cta ring-1 ring-white/20 hover:brightness-110"
      }`}
    >
      <span
        className={`flex size-9 items-center justify-center rounded-full ${isOutline ? "bg-brand-primary/20 text-brand-accent" : "bg-white/20"}`}
      >
        <Phone className="size-4" strokeWidth={2.5} />
      </span>
      <span className="flex flex-col items-start leading-tight">
        <span className="text-xs font-bold uppercase tracking-wide opacity-90">Call now</span>
        <span className="font-mono text-base tracking-wide">{displayNumber}</span>
      </span>
      {isPrimary ? <Headphones className="ml-auto size-4 opacity-80" aria-hidden /> : null}
    </a>
  );
}

function CallButtonPlaceholder({
  variant,
  className,
}: {
  variant: DirectCallButtonProps["variant"];
  className?: string;
}) {
  const isHero = variant === "hero";
  const isHeader = variant === "header";
  const isSticky = variant === "sticky";

  if (isHero || isSticky) {
    return (
      <div
        className={`inline-flex max-w-full items-center gap-2 rounded-xl border border-dashed border-white/30 bg-white/10 px-4 py-3 text-sm text-white/80 ${className}`}
        role="note"
        title="Set NEXT_PUBLIC_DIRECT_CALL_PHONE in apps/web/.env.development"
      >
        <Phone className="size-4 shrink-0 opacity-70" />
        <span>Add call number in apps/web/.env</span>
      </div>
    );
  }

  if (isHeader) {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2.5 text-sm font-bold text-white shadow-cta ring-2 ring-white/25 ${className}`}
        title="Set NEXT_PUBLIC_DIRECT_CALL_PHONE in apps/web/.env"
      >
        <Phone className="size-4" />
        Call now
      </span>
    );
  }

  return (
    <div
      className={`flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-brand-primary to-[#ff8f1f] px-4 py-3.5 text-sm font-semibold text-white shadow-cta ring-1 ring-white/25 ${className}`}
      title="Set NEXT_PUBLIC_DIRECT_CALL_PHONE in apps/web/.env"
    >
      <Phone className="size-5 shrink-0" />
      <span>Call now — add phone in apps/web/.env</span>
    </div>
  );
}
