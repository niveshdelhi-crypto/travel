import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import {
  Badge,
  Panel,
  PanelHeader,
  StatCard,
  ProgressBar,
  Avatar,
  MetricWidget,
} from "@/components/app/primitives";
import {
  Building2,
  Star,
  MapPin,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Users,
  Car,
  Globe,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  ArrowUpRight,
} from "lucide-react";
import type { Provider } from "@/types";

export const Route = createFileRoute("/app/providers")({
    component: ProvidersPage,
});

const providers: Provider[] = [
  { id: "p1", name: "Hertz",      tier: "A+", vehicleCount: 4218, fillRate: "98.4%", fillRateValue: 98.4, rating: 4.9, status: "active",   locations: 142, monthlyRevenue: "$284k", slaScore: 96 },
  { id: "p2", name: "Enterprise", tier: "A",  vehicleCount: 3870, fillRate: "94.2%", fillRateValue: 94.2, rating: 4.8, status: "active",   locations: 108, monthlyRevenue: "$220k", slaScore: 92 },
  { id: "p3", name: "Sixt",       tier: "A",  vehicleCount: 2210, fillRate: "92.7%", fillRateValue: 92.7, rating: 4.8, status: "active",   locations: 84,  monthlyRevenue: "$168k", slaScore: 90 },
  { id: "p4", name: "Avis",       tier: "A-", vehicleCount: 2902, fillRate: "89.1%", fillRateValue: 89.1, rating: 4.7, status: "degraded", locations: 97,  monthlyRevenue: "$145k", slaScore: 81 },
  { id: "p5", name: "Budget",     tier: "B+", vehicleCount: 1820, fillRate: "84.0%", fillRateValue: 84.0, rating: 4.5, status: "active",   locations: 72,  monthlyRevenue: "$112k", slaScore: 78 },
  { id: "p6", name: "Alamo",      tier: "B",  vehicleCount: 1402, fillRate: "78.6%", fillRateValue: 78.6, rating: 4.4, status: "active",   locations: 58,  monthlyRevenue: "$88k",  slaScore: 74 },
  { id: "p7", name: "National",   tier: "B+", vehicleCount: 1180, fillRate: "86.2%", fillRateValue: 86.2, rating: 4.6, status: "active",   locations: 63,  monthlyRevenue: "$102k", slaScore: 80 },
  { id: "p8", name: "Thrifty",    tier: "B-", vehicleCount: 890,  fillRate: "72.1%", fillRateValue: 72.1, rating: 4.2, status: "degraded", locations: 41,  monthlyRevenue: "$64k",  slaScore: 68 },
];

const TIER_TONE = {
  "A+": "success", "A": "success", "A-": "info",
  "B+": "warning", "B": "warning", "B-": "danger", "C": "danger",
} as const;

function ProvidersPage() {
  const active    = providers.filter((p) => p.status === "active").length;
  const degraded  = providers.filter((p) => p.status === "degraded").length;
  const totalVehicles = providers.reduce((a, p) => a + p.vehicleCount, 0);

  return (
    <AppShell title="Providers">
      <div className="space-y-6 p-6">

        {/* KPI row */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total providers"  value={String(providers.length)} delta="+2 this quarter" icon={Building2} spark={[6,7,7,8,8,8,8,8,8,8]} />
          <StatCard label="Active"           value={String(active)}           delta="Operational"      icon={CheckCircle2} spark={[5,6,6,6,6,6,6,6,6,6]} />
          <StatCard label="Fleet vehicles"   value={totalVehicles.toLocaleString()} delta="+840 added" icon={Car} spark={[14000,15000,15400,16200,16800,17200,17600,17900,18100,18420]} />
          <StatCard label="Avg fill rate"    value="88.2%"                    delta="+1.4%"           icon={TrendingUp} spark={[82,83,84,84,85,86,86,87,87,88]} />
        </div>

        {/* Search / filter bar */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search providers…"
              className="h-8 w-64 rounded-md border border-border bg-surface pl-8 pr-3 text-sm focus:outline-none"
            />
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs hover:bg-surface-2">
            <Filter className="h-3.5 w-3.5" /> All tiers
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs hover:bg-surface-2">
            All regions
          </button>
          {degraded > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-warning/20 bg-warning/10 px-2.5 py-1.5 text-xs text-warning">
              <AlertTriangle className="h-3 w-3" />
              {degraded} degraded
            </span>
          )}
          <div className="ml-auto">
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> Add provider
            </button>
          </div>
        </div>

        {/* Provider grid */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </div>

        {/* Performance table */}
        <Panel>
          <PanelHeader
            title="Performance benchmarks"
            subtitle="SLA scoring and fill rate trends"
            right={
              <button className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                Export <ArrowUpRight className="h-3 w-3" />
              </button>
            }
          />
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-2.5">Provider</th>
                <th className="px-3 py-2.5">Tier</th>
                <th className="px-3 py-2.5">Fill rate</th>
                <th className="px-3 py-2.5">SLA score</th>
                <th className="px-3 py-2.5">Vehicles</th>
                <th className="px-3 py-2.5">Locations</th>
                <th className="px-3 py-2.5">Rev. / mo</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-surface-2">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{p.name}</div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="h-2.5 w-2.5" />
                          {p.locations} locations
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={TIER_TONE[p.tier]}>{p.tier}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={p.fillRateValue} className="w-20" />
                      <span className="text-xs text-foreground">{p.fillRate}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={p.slaScore ?? 0} className="w-16" />
                      <span className="text-xs text-foreground">{p.slaScore}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-foreground">{p.vehicleCount.toLocaleString()}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      {p.locations}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-medium text-foreground">{p.monthlyRevenue}</td>
                  <td className="px-3 py-3">
                    <Badge tone={p.status === "active" ? "success" : "warning"}>
                      {p.status === "active" ? "Active" : "Degraded"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </AppShell>
  );
}

function ProviderCard({ provider: p }: { provider: Provider }) {
  return (
    <div className="group rounded-xl border border-border bg-surface p-5 transition hover:border-border-strong hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-surface-2">
            <Building2 className="h-4.5 w-4.5 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground">{p.name}</span>
              <Badge tone={TIER_TONE[p.tier]}>{p.tier}</Badge>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {p.vehicleCount.toLocaleString()} vehicles
            </div>
          </div>
        </div>
        {p.status === "degraded" && (
          <AlertTriangle className="h-4 w-4 text-warning" />
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MetricWidget label="Fill rate" value={p.fillRate} tone={p.fillRateValue >= 90 ? "success" : p.fillRateValue >= 80 ? "neutral" : "warning"} />
        <MetricWidget label="Rating"    value={`${p.rating}★`} tone="neutral" />
        <MetricWidget label="Locations" value={p.locations}  tone="neutral" />
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Fill rate</span>
          <span>{p.fillRate}</span>
        </div>
        <ProgressBar value={p.fillRateValue} tone={p.fillRateValue >= 90 ? "success" : "primary"} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Star className="h-3 w-3 fill-primary text-primary" />
          <span className="text-foreground">{p.rating}</span>
          <span className="text-muted-foreground">·</span>
          <span>{p.monthlyRevenue}/mo</span>
        </div>
        <button className="text-xs font-medium text-primary hover:underline">
          View details
        </button>
      </div>
    </div>
  );
}
