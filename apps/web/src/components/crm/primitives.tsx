import type { LucideIcon } from "lucide-react";

export type BadgeTone = "neutral" | "primary" | "success" | "warning" | "info";

const BADGE_STYLES: Record<BadgeTone, string> = {
  neutral: "bg-[#e9eef5] text-[#36445a]",
  primary: "bg-[#172033] text-white",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-900",
  info: "bg-sky-100 text-sky-800",
};

export function Panel({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border border-[#d7dde8] bg-white ${className}`}>{children}</div>
  );
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
    <div className="flex items-start justify-between gap-3 border-b border-[#d7dde8] px-5 py-4">
      <div>
        <h3 className="text-sm font-semibold text-[#172033]">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-xs text-[#637083]">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-xl border border-[#d7dde8] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wider text-[#637083]">{label}</p>
        {Icon ? (
          <span className="grid h-7 w-7 place-items-center rounded-md border border-[#d7dde8] bg-[#f8fafc] text-[#637083]">
            <Icon className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-[#172033]">{value}</p>
      {delta ? <p className="mt-1 text-xs text-[#637083]">{delta}</p> : null}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ${BADGE_STYLES[tone]}`}
    >
      {children}
    </span>
  );
}

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#172033] text-xs font-semibold text-white">
      {initials || "?"}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="p-10 text-center">
      {Icon ? <Icon className="mx-auto mb-3 h-8 w-8 text-[#637083]" /> : null}
      <p className="font-semibold text-[#172033]">{title}</p>
      <p className="mt-1 text-sm text-[#637083]">{description}</p>
    </div>
  );
}

export function CrmPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f5f7fa] text-[#172033]">
      <div className="border-b border-[#d7dde8] bg-white px-5 py-4">
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      {children}
    </main>
  );
}
