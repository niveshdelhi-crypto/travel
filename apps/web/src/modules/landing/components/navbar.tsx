"use client";

import Link from "next/link";
import type { Route } from "next";
import { Globe, Menu, X } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { BRAND_NAVBAR_HEIGHT_CLASS } from "@/lib/brand";
import { DirectCallButton } from "./direct-call-button";

const navLinks = [
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function LandingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-brand-dark/90 backdrop-blur-md">
      <div
        className={`container-page flex ${BRAND_NAVBAR_HEIGHT_CLASS} items-center justify-between gap-4 sm:gap-6`}
      >
        <BrandLogo href="/" size="nav" priority />

        <nav className="hidden items-center gap-7 text-sm font-medium text-brand-muted lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href as Route}
              className="transition-colors hover:text-brand-text"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-brand-muted"
          >
            <Globe className="size-3.5" /> EN · USD
          </button>
          <DirectCallButton variant="header" className="shrink-0" />
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-brand-text lg:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-brand-dark lg:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href as Route}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-brand-muted hover:bg-white/5 hover:text-brand-text"
              >
                {l.label}
              </Link>
            ))}
            <div className="px-3 pt-2">
              <DirectCallButton variant="header" className="w-full justify-center" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
