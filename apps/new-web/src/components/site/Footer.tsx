import { BrandLogo } from "@/components/site/BrandLogo";
import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Twitter, Youtube, Apple, Smartphone } from "lucide-react";

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Popular Countries",
    links: [
      { label: "Car rental UAE", href: "/cars/uae" },
      { label: "Car rental Spain", href: "/cars/spain" },
      { label: "Car rental Canada", href: "/cars/canada" },
      { label: "Car rental UK", href: "/cars/uk" },
      { label: "Car rental USA", href: "/cars/usa" },
      { label: "Car rental Turkey", href: "/cars/turkey" },
    ],
  },
  {
    title: "Top Airports",
    links: [
      { label: "Dubai (DXB)", href: "/cars/uae/dxb-airport" },
      { label: "London Heathrow (LHR)", href: "/cars/uk/lhr-airport" },
      { label: "Toronto (YYZ)", href: "/cars/canada/yyz-airport" },
      { label: "Barcelona (BCN)", href: "/cars/spain/bcn-airport" },
      { label: "New York (JFK)", href: "/cars/usa/jfk-airport" },
      { label: "Bangkok (BKK)", href: "/cars/thailand/bkk-airport" },
    ],
  },
  {
    title: "Suppliers",
    links: [
      { label: "Hertz", href: "/suppliers/hertz" },
      { label: "Avis", href: "/suppliers/avis" },
      { label: "Enterprise", href: "/suppliers/enterprise" },
      { label: "Budget", href: "/suppliers/budget" },
      { label: "Europcar", href: "/suppliers/europcar" },
      { label: "Sixt", href: "/suppliers/sixt" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/support" },
      { label: "Manage Booking", href: "/my-booking" },
      { label: "Contact Us", href: "/contact" },
      { label: "Insurance", href: "/insurance" },
      { label: "FAQs", href: "/faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & Conditions", href: "/legal/terms" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Cookie Policy", href: "/legal/cookies" },
      { label: "Refund Policy", href: "/legal/refunds" },
      { label: "Rental Conditions", href: "/legal/rental-conditions" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="container-page py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-1">
            <BrandLogo to="/" size="xl" />
            <p className="mt-4 text-sm text-white/70 leading-relaxed">
              Compare 800+ car rental suppliers in 190+ countries. Best price, free
              cancellation, no hidden fees.
               <h5 className="font-display text-base font-semibold">30 N Gould St Ste R <br> Sheridan Country<br> Sheridan, Wyoming 82801</h5>
            </p>
            <div className="mt-6 flex gap-3 text-white/70">
              <a href="#" aria-label="Twitter" className="hover:text-white"><Twitter className="size-5" /></a>
              <a href="#" aria-label="Instagram" className="hover:text-white"><Instagram className="size-5" /></a>
              <a href="#" aria-label="Facebook" className="hover:text-white"><Facebook className="size-5" /></a>
              <a href="#" aria-label="Youtube" className="hover:text-white"><Youtube className="size-5" /></a>
            </div>
          </div>

          {columns.map((c) => (
            <div key={c.title}>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white/90">{c.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link to={l.href as string} className="text-sm text-white/70 hover:text-white">
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
            <h5 className="font-display text-base font-semibold">Get the MarkleTravelBooking app</h5>
            <p className="mt-1 text-sm text-white/70">Manage bookings on the go. Exclusive in-app deals.</p>
          </div>
          <div className="mt-4 flex gap-3 md:mt-0">
            <a href="#" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/15">
              <Apple className="size-4" /> App Store
            </a>
            <a href="#" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/15">
              <Smartphone className="size-4" /> Google Play
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} MarkleTravelBooking Rentals. All rights reserved.</p>
          <p>Secured by 256-bit SSL · PCI DSS compliant · Trusted by millions worldwide</p>
        </div>
      </div>
    </footer>
  );
}
