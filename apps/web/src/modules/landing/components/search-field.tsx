import type { ReactNode } from "react";
import { cn } from "../lib/utils";

type SearchFieldProps = {
  label: string;
  icon: ReactNode;
  className?: string;
  error?: string;
  children: ReactNode;
  variant?: "dark" | "light";
  compact?: boolean;
};

const fieldInputClass =
  "w-full bg-transparent outline-none text-sm text-brand-text placeholder:text-brand-muted/80";

/** Native selects on dark glass panels — pairs with `.glass-panel` rules in globals.css */
export const fieldSelectClass = `${fieldInputClass} glass-field-select cursor-pointer`;

export function SearchField({
  label,
  icon,
  className,
  error,
  children,
  variant = "dark",
  compact = false,
}: SearchFieldProps) {
  const isDark = variant === "dark";

  return (
    <label
      className={cn(
        "group block border transition-colors",
        compact ? "rounded-xl px-3 py-2" : "rounded-2xl px-3.5 py-2.5",
        isDark
          ? "border-white/12 bg-white/[0.06] focus-within:border-brand-primary/60 focus-within:bg-white/[0.1]"
          : "border-border bg-surface-muted/60 focus-within:border-brand-primary focus-within:bg-white",
        error && "border-destructive/50",
        className,
      )}
    >
      <span
        className={cn(
          "flex items-center gap-1.5 font-semibold uppercase tracking-wider",
          compact ? "text-[10px]" : "text-[11px]",
          isDark ? "text-brand-muted" : "text-muted-foreground",
        )}
      >
        {icon}
        {label}
      </span>
      <div
        className={cn(compact ? "mt-0.5" : "mt-1", isDark ? "text-brand-text" : "text-foreground")}
      >
        {children}
      </div>
      {error ? <span className="mt-1 block text-xs text-red-300">{error}</span> : null}
    </label>
  );
}

export { fieldInputClass };
