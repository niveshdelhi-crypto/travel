"use client";

import { Headphones, Phone, PhoneCall } from "lucide-react";
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
        className={`group relative block w-full max-w-lg ${className}`}
      >
        <span
          className="pointer-events-none absolute -inset-1 rounded-[1.35rem] bg-brand-primary/40 opacity-75 blur-md transition group-hover:opacity-100"
          aria-hidden
        />
        <span className="pointer-events-none absolute inset-0 rounded-2xl bg-brand-primary/30 animate-ping opacity-20" aria-hidden />

        <span className="relative flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-primary via-[#ff8f1f] to-[#ffb347] px-5 py-4 text-white shadow-cta ring-2 ring-white/25 transition duration-200 group-hover:scale-[1.02] group-hover:brightness-105 group-active:scale-[0.99] sm:px-6 sm:py-5">
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/35 backdrop-blur-sm sm:size-16"
            aria-hidden
          >
            <PhoneCall className="size-7 sm:size-8" strokeWidth={2.25} />
          </span>

          <span className="min-w-0 flex-1 text-left">
            <span className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white sm:text-xs">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-70" />
                  <span className="relative inline-flex size-2 rounded-full bg-white" />
                </span>
                Live advisors
              </span>
              <span className="text-xs font-medium text-white/85">24/7 · No hold music</span>
            </span>
            <span className="mt-1 block font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Call now
            </span>
            <span className="mt-0.5 block truncate font-mono text-base font-semibold tracking-wide text-white/95 sm:text-lg">
              {displayNumber}
            </span>
            {sublabel ? (
              <span className="mt-1 block text-sm text-white/80">{sublabel}</span>
            ) : (
              <span className="mt-1 block text-sm text-white/80">
                Tap to speak with a rental specialist — free quote in minutes
              </span>
            )}
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
        className={`group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-brand-primary to-[#ff8f1f] px-4 py-3.5 text-white shadow-cta ring-1 ring-white/20 transition active:scale-[0.98] ${className}`}
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-white/20">
          <Phone className="size-5" strokeWidth={2.5} />
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
            Call now
          </span>
          <span className="font-mono text-sm font-bold tracking-wide">{displayNumber}</span>
        </span>
        <PhoneCall className="ml-auto size-5 opacity-80" aria-hidden />
      </a>
    );
  }

  if (isHeader) {
    return (
      <a
        href={telHref!}
        aria-label={`Call now at ${displayNumber}`}
        className={`group inline-flex max-w-full items-center gap-2 rounded-full bg-brand-primary px-3 py-2 text-white shadow-cta ring-2 ring-brand-primary/30 transition hover:brightness-110 active:scale-[0.98] sm:gap-2.5 sm:px-4 sm:py-2.5 ${className}`}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20 sm:size-9">
          <Phone className="size-4 sm:size-[18px]" strokeWidth={2.5} />
        </span>
        <span className="hidden min-w-0 flex-col text-left leading-none sm:flex">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
            Call now
          </span>
          <span className="truncate font-mono text-xs font-semibold">{displayNumber}</span>
        </span>
        <span className="font-display text-sm font-bold sm:hidden">Call</span>
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
  const isHeader = variant === "header";
  const baseClass = `flex items-center justify-center gap-2 border border-dashed border-white/25 bg-white/[0.04] text-brand-muted ${
    isHeader ? "rounded-full px-4 py-2 text-xs" : "w-full rounded-xl px-4 py-3 text-xs"
  } ${className}`;

  return (
    <div
      className={baseClass}
      title="Set NEXT_PUBLIC_DIRECT_CALL_PHONE in .env or DIRECT_CALL_PHONE_NUMBER in constants.ts"
    >
      <Phone className="size-4 shrink-0 opacity-50" />
      <span>{isHeader ? "Set call number" : "Add your call number in env to enable Call now"}</span>
    </div>
  );
}
