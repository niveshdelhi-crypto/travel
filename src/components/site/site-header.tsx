import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Brand } from "@/components/brand";
import { ChevronDown, LayoutDashboard } from "lucide-react";

const links = [
  { label: "Locations", to: "/" },
  { label: "Vehicles", to: "/search" },
  { label: "Providers", to: "/" },
  { label: "Support", to: "/" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-border bg-background/70 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Brand />
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {l.label}
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/app"
            className="hidden items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <button className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent">
            Sign in
          </button>
          <Link
            to="/search"
            className="rounded-md bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
          >
            Book a car
          </Link>
        </div>
      </div>
    </header>
  );
}
