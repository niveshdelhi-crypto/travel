import type { ReactNode } from "react";
import { cn } from "../lib/utils";

type SearchFieldProps = {
  label: string;
  icon: ReactNode;
  className?: string;
  error?: string;
  children: ReactNode;
  variant?: "dark" | "light";
};

const fieldInputClass =
  "w-full bg-transparent outline-none text-sm placeholder:text-brand-muted/80";

export function SearchField({
  label,
  icon,
  className,
  error,
  children,
  variant = "dark",
}: SearchFieldProps) {
  const isDark = variant === "dark";

  return (
    <label
      className={cn(
        "group block rounded-2xl border px-3.5 py-2.5 transition-colors",
        isDark
          ? "border-white/12 bg-white/[0.06] focus-within:border-brand-primary/60 focus-within:bg-white/[0.1]"
          : "border-border bg-surface-muted/60 focus-within:border-brand-primary focus-within:bg-white",
        error && "border-destructive/50",
        className,
      )}
    >
      <span
        className={cn(
          "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider",
          isDark ? "text-brand-muted" : "text-muted-foreground",
        )}
      >
        {icon}
        {label}
      </span>
      <div className={cn("mt-1", isDark ? "text-brand-text" : "text-foreground")}>{children}</div>
      {error ? <span className="mt-1 block text-xs text-red-300">{error}</span> : null}
    </label>
  );
}

export { fieldInputClass };
