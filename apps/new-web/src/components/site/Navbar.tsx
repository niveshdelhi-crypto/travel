import { Link } from "@tanstack/react-router";
import { Globe, Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { to: "/cars/uae", label: "Countries" },
  { to: "/deals", label: "Deals" },
  { to: "/suppliers", label: "Suppliers" },
  { to: "/support", label: "Support" },
  { to: "/my-booking", label: "My Booking" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-navy-foreground font-display font-bold">F</span>
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            Fleet<span className="text-accent">Nexus</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-foreground/80">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to as string}
              className="transition-colors hover:text-accent"
              activeProps={{ className: "text-accent" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <button className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground/80 hover:bg-muted">
            <Globe className="size-3.5" /> EN · USD
          </button>
          <Link
            to="/sign-in"
            className="rounded-full px-4 py-2 text-sm font-semibold text-navy hover:bg-muted"
          >
            Sign In
          </Link>
        </div>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-white">
          <div className="container-page py-4 flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to as string}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/sign-in"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-navy px-3 py-2.5 text-center text-sm font-semibold text-navy-foreground"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
