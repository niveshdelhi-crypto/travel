import { Link } from "@tanstack/react-router";
import { PLATFORM_NAME } from "@/constants";

export function Brand({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5" aria-label={`${PLATFORM_NAME} home`}>
      <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-warning shadow-[0_0_12px_oklch(0.86_0.17_92/0.4)]">
        <span className="text-xs font-bold text-primary-foreground">B</span>
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-[13px] font-bold tracking-tight text-foreground">
          Book my <span className="text-primary">Carz</span>
        </span>
        <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Operations
        </span>
      </div>
    </Link>
  );
}
