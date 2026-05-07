import { Link } from "@tanstack/react-router";

export function Brand({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5" aria-label="FleetNexus home">
      {/* Logo mark */}
      <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-warning shadow-[0_0_12px_oklch(0.86_0.17_92/0.4)]">
        <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
          <path d="M2 6h12M2 10h12" stroke="oklch(0.18 0.03 260)" strokeWidth="1.5" strokeLinecap="round"/>
          <rect x="4" y="4" width="8" height="8" rx="1" stroke="oklch(0.18 0.03 260)" strokeWidth="1.5"/>
          <circle cx="5" cy="11" r="1" fill="oklch(0.18 0.03 260)"/>
          <circle cx="11" cy="11" r="1" fill="oklch(0.18 0.03 260)"/>
        </svg>
      </div>
      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <span className="text-[13px] font-bold tracking-tight text-foreground">
          Fleet<span className="text-primary">Nexus</span>
        </span>
        <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Operations
        </span>
      </div>
    </Link>
  );
}
