import Link from "next/link";
import type { Route } from "next";
import { Apple, Globe, MessageCircle, Share2, Smartphone } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Countries",
    links: [
      { label: "Car rental UAE", href: "/cars/uae" },
      { label: "Car rental Spain", href: "/cars/spain" },
      { label: "Car rental Canada", href: "/cars/canada" },
      { label: "Car rental UK", href: "/cars/uk" },
      { label: "Car rental USA", href: "/cars/usa" },
    ],
  },
  {
    title: "Popular Cities",
    links: [
      { label: "Dubai", href: "/cars/uae" },
      { label: "London", href: "/cars/uk" },
      { label: "Toronto", href: "/cars/canada" },
      { label: "Barcelona", href: "/cars/spain" },
      { label: "New York", href: "/cars/usa" },
    ],
  },
  {
    title: "Suppliers",
    links: [
      { label: "Hertz", href: "/#search" },
      { label: "Avis", href: "/#search" },
      { label: "Enterprise", href: "/#search" },
      { label: "Budget", href: "/#search" },
      { label: "Alamo", href: "/#search" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
      { label: "About", href: "/about" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & Conditions", href: "/terms-and-conditions" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Rental Conditions", href: "/rental-conditions" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="container-page py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          <div className="flex flex-col items-start lg:col-span-1">
            <BrandLogo href="/" size="xl" />
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Compare 800+ car rental suppliers in 190+ countries. Best price, free cancellation, no
              hidden fees.
            </p>
            <div className="mt-6 flex gap-3 text-white/70">
              <a href="#" aria-label="Social" className="hover:text-white">
                <Share2 className="size-5" />
              </a>
              <a href="#" aria-label="Community" className="hover:text-white">
                <MessageCircle className="size-5" />
              </a>
              <a href="#" aria-label="Web" className="hover:text-white">
                <Globe className="size-5" />
              </a>
            </div>
          </div>

          {columns.map((c) => (
            <div key={c.title}>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white/90">
                {c.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href as Route} className="text-sm text-white/70 hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6 md:flex md:items-center md:justify-between">
          <div>
            <h5 className="font-display text-base font-semibold">
              Get the MarkleTravelBooking app
            </h5>
            <p className="mt-1 text-sm text-white/70">Manage bookings on the go. Coming soon.</p>
          </div>
          <div className="mt-4 flex gap-3 md:mt-0">
            <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white/70">
              <Apple className="size-4" /> App Store
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white/70">
              <Smartphone className="size-4" /> Google Play
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} MarkleTravelBooking Rentals. All rights reserved.</p>
          <p>Secured by 256-bit SSL · PCI DSS compliant · Trusted worldwide</p>
        </div>
      </div>
    </footer>
  );
}
