"use client";

import { Phone } from "lucide-react";
import {
  formatDirectCallLabel,
  getDirectCallPhone,
  getDirectCallTelHref,
  isDirectCallConfigured,
} from "../lib/direct-call";

type DirectCallButtonProps = {
  variant?: "primary" | "outline" | "header";
  className?: string;
};

export function DirectCallButton({ variant = "outline", className = "" }: DirectCallButtonProps) {
  const phone = getDirectCallPhone();
  const telHref = getDirectCallTelHref();
  const configured = isDirectCallConfigured();

  const isOutline = variant === "outline";
  const isHeader = variant === "header";
  const baseClass = `flex cursor-pointer items-center justify-center gap-2 font-semibold transition ${
    isHeader
      ? "rounded-full px-4 py-2 text-sm"
      : "w-full rounded-xl px-4 py-3 text-sm"
  } ${className}`;

  if (!configured) {
    return (
      <div
        className={`${baseClass} border border-dashed border-white/20 bg-white/[0.03] text-brand-muted`}
        title="Set DIRECT_CALL_PHONE_NUMBER in constants.ts or NEXT_PUBLIC_DIRECT_CALL_PHONE in .env"
      >
        <Phone className="size-4 shrink-0 opacity-60" />
        <span className={isHeader ? "hidden text-xs sm:inline" : "text-xs"}>
          {isHeader ? (
            "Set call number"
          ) : (
            <>
              Call button — add your number in{" "}
              <code className="text-brand-accent">DIRECT_CALL_PHONE_NUMBER</code>
            </>
          )}
        </span>
        {isHeader ? <span className="text-xs sm:hidden">Call</span> : null}
      </div>
    );
  }

  return (
    <a
      href={telHref!}
      className={`${baseClass} ${
        isHeader
          ? "bg-emerald-600 text-white shadow-md hover:bg-emerald-500"
          : isOutline
            ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-100 hover:border-emerald-400/60 hover:bg-emerald-500/20"
            : "bg-emerald-600 text-white shadow-md hover:bg-emerald-500"
      }`}
    >
      <Phone className="size-4 shrink-0" />
      <span className={isHeader ? "truncate" : undefined}>
        {isHeader ? (
          <>
            <span className="hidden sm:inline">Call · </span>
            <span className="font-mono tracking-wide">{formatDirectCallLabel(phone!)}</span>
          </>
        ) : (
          <>
            Call us · <span className="font-mono tracking-wide">{formatDirectCallLabel(phone!)}</span>
          </>
        )}
      </span>
    </a>
  );
}
