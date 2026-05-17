"use client";

import Link from "next/link";
import { Search } from "lucide-react";

export function MobileStickyCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-brand-dark/95 p-3 backdrop-blur-md md:hidden">
      <Link
        href="/#search"
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-primary py-3.5 text-sm font-semibold text-white shadow-cta"
      >
        <Search className="size-4" />
        Search Cars
      </Link>
    </div>
  );
}
