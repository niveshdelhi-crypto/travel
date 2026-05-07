import { Link } from "@tanstack/react-router";

export function Brand({ to = "/", className = "" }: { to?: string; className?: string }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-primary to-warning text-primary-foreground shadow-[0_4px_18px_-4px_oklch(0.86_0.17_92/0.6)]">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h18M5 12l1.5-4.5A2 2 0 0 1 8.4 6h7.2a2 2 0 0 1 1.9 1.5L19 12M5 12v5h2v1h2v-1h6v1h2v-1h2v-5" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-tight text-foreground">RentOps</span>
        <span className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground">USA · CA</span>
      </span>
    </Link>
  );
}
