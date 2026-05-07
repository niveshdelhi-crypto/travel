// Shared CRM primitives
import * as React from "react";
import { type LucideIcon } from "lucide-react";

export function Panel({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-xl border border-border bg-surface ${className}`}>{children}</div>;
}

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
  trend?: "up" | "down" | "flat";
  icon?: LucideIcon;
  spark?: number[];
}) {
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-surface p-5 transition hover:border-border-strong">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
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

export function Sparkline({ values }: { values: number[] }) {
  const w = 120, h = 32, max = Math.max(...values), min = Math.min(...values);
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

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "primary";
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-surface-2 text-foreground/80 border-border",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    danger: "bg-destructive/10 text-destructive border-destructive/20",
    info: "bg-secondary/10 text-secondary border-secondary/20",
    primary: "bg-primary/10 text-primary border-primary/20",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Avatar({ name, tone = "blue" }: { name: string; tone?: "blue" | "violet" | "amber" | "emerald" | "rose" }) {
  const tones: Record<string, string> = {
    blue: "from-secondary to-info",
    violet: "from-secondary to-primary",
    amber: "from-warning to-primary",
    emerald: "from-success to-info",
    rose: "from-destructive to-warning",
  };
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br text-[10px] font-semibold text-foreground ${tones[tone]}`}>
      {initials}
    </span>
  );
}
