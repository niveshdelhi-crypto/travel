import { Link } from "@tanstack/react-router";
import { ArrowRight, Car } from "lucide-react";
import { MegaFooter } from "@/components/marketing/mega-footer";

type ShellProps = {
  children: React.ReactNode;
  navVariant?: "glass" | "solid";
};

export function MarketingChrome({ children, navVariant = "glass" }: ShellProps) {
  return (
    <div className="min-h-screen bg-[#07111F] text-[#F8FAFC]">
      <MarketingNav variant={navVariant} />
      {children}
      <MegaFooter />
    </div>
  );
}

function MarketingNav({ variant }: { variant: NonNullable<ShellProps["navVariant"]> }) {
  const wrapper =
    variant === "glass"
      ? "border-b border-white/10 bg-black/35 backdrop-blur-xl"
      : "border-b border-white/12 bg-[#07111F]/94 backdrop-blur";

  return (
    <header className={`sticky top-0 z-40 ${wrapper}`}>
      <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg border border-[#F5B301]/55 bg-[#F5B301]/95 text-[#07111F] shadow-[0_18px_50px_-30px_rgba(245,179,1,.9)]">
            <Car className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.32em] text-[#F8FAFC]/72">
              Book my Carz
            </span>
            <span className="hidden text-[11px] text-[#94A3B8] sm:inline">
              Global rental marketplace
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-7 text-[13px] text-[#F8FAFC]/78 md:flex">
          <Link to="/countries" className="transition hover:text-[#F8FAFC]">
            Destinations
          </Link>
          <Link to="/conditions" className="transition hover:text-[#F8FAFC]">
            Rental conditions
          </Link>
          <Link to="/help-center" className="transition hover:text-[#F8FAFC]">
            Help center
          </Link>
        </div>

        <Link
          to="/"
          hash="lead-form"
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#F5B301] via-[#fcd34d] to-[#eab308] px-4 text-xs font-bold text-[#07111F] shadow-[0_18px_48px_-34px_rgba(245,179,1,.85)] transition hover:brightness-[1.03] md:text-[13px]"
        >
          Book assistance
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </nav>
    </header>
  );
}
