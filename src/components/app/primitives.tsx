// ============================================================
// FleetNexus — Enhanced Shared Primitives
// Production-grade reusable components for the CRM
// ============================================================
import * as React from "react";
import { type LucideIcon } from "lucide-react";
import type { BadgeTone, TrendDirection } from "@/types";

// ─── Panel ────────────────────────────────────────────────────

export function Panel({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border border-border bg-surface ${className}`}>
      {children}
    </div>
  );
}

// ─── Panel Header ─────────────────────────────────────────────

export function PanelHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  delta,
  trend = "up",
  icon: Icon,
  spark,
}: {
  label: string;
  value: string;
  delta?: string;
  trend?: TrendDirection;
  icon?: LucideIcon;
  spark?: number[];
}) {
  const trendColor =
    trend === "up"
      ? "text-success"
      : trend === "down"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-surface p-5 transition hover:border-border-strong">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        {Icon && (
          <div className="grid h-7 w-7 place-items-center rounded-md border border-border bg-surface-2 text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-2xl font-semibold tracking-tight text-foreground">{value}</div>
        {delta && <span className={`text-xs font-medium ${trendColor}`}>{delta}</span>}
      </div>
      {spark && <Sparkline values={spark} />}
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────

export function Sparkline({ values }: { values: number[] }) {
  const w = 120,
    h = 32,
    max = Math.max(...values),
    min = Math.min(...values);
  const norm = (v: number) => h - ((v - min) / Math.max(1, max - min)) * h;
  const step = w / (values.length - 1);
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${norm(v)}`).join(" ");
  const area = `${d} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-8 w-full">
      <defs>
        <linearGradient id="spark-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.86 0.17 92)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="oklch(0.86 0.17 92)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-grad)" />
      <path d={d} stroke="oklch(0.86 0.17 92)" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

// ─── Badge ────────────────────────────────────────────────────

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-foreground/80 border-border",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  danger: "bg-destructive/10 text-destructive border-destructive/20",
  info: "bg-secondary/10 text-secondary border-secondary/20",
  primary: "bg-primary/10 text-primary border-primary/20",
};

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${BADGE_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────

const AVATAR_TONES = {
  blue: "from-secondary to-info",
  violet: "from-secondary to-primary",
  amber: "from-warning to-primary",
  emerald: "from-success to-info",
  rose: "from-destructive to-warning",
};

export function Avatar({
  name,
  tone = "blue",
  size = "sm",
}: {
  name: string;
  tone?: keyof typeof AVATAR_TONES;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const sizes = {
    xs: "h-5 w-5 text-[8px]",
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-11 w-11 text-sm",
  };
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-semibold text-foreground ${AVATAR_TONES[tone]} ${sizes[size]}`}
    >
      {initials}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-md ${className}`} aria-hidden />;
}

export function SkeletonText({ lines = 1, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5" aria-hidden>
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="mt-4 h-7 w-1/2" />
      <Skeleton className="mt-3 h-8 w-full" />
    </div>
  );
}

// ─── Status Dot ───────────────────────────────────────────────

const STATUS_DOT_COLORS = {
  available: "bg-success",
  on_call: "bg-info",
  wrap_up: "bg-warning",
  break: "bg-muted-foreground",
  offline: "bg-destructive",
};

export function StatusDot({
  status,
  pulse = false,
}: {
  status: keyof typeof STATUS_DOT_COLORS;
  pulse?: boolean;
}) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT_COLORS[status]} ${pulse ? "pulse-dot" : ""}`}
    />
  );
}

// ─── Empty State ─────────────────────────────────────────────

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl border border-border bg-surface-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-xs text-xs text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────

export function ProgressBar({
  value,
  max = 100,
  tone = "primary",
  className = "",
}: {
  value: number;
  max?: number;
  tone?: "primary" | "success" | "warning" | "danger";
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = {
    primary: "from-primary to-warning",
    success: "from-success to-info",
    warning: "from-warning to-primary",
    danger: "from-destructive to-warning",
  };
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-surface-2 ${className}`}>
      <div
        className={`h-full rounded-full bg-gradient-to-r ${colors[tone]} transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────

export function Divider({ className = "" }: { className?: string }) {
  return <div className={`h-px w-full bg-border ${className}`} />;
}

// ─── Metric Widget ────────────────────────────────────────────

export function MetricWidget({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const toneColors = {
    neutral: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
  };
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-base font-semibold ${toneColors[tone]}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  const alignClass = align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl";
  return (
    <div className={alignClass}>
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        {eyebrow}
      </span>
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        {title}
      </h2>
      {subtitle && <p className="mt-3 text-pretty text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
