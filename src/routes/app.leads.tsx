import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { Avatar, Badge } from "@/components/app/primitives";
import { Filter, MoreHorizontal, Plus, Search, Star, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/leads")({
    component: LeadsPage,
});

type Lead = {
  id: string;
  name: string;
  trip: string;
  dates: string;
  budget: string;
  urgency: "high" | "med" | "low";
  payment: "paid" | "pending" | "unpaid";
  agent: string;
  score: number;
  tone: "blue" | "violet" | "amber" | "emerald" | "rose";
};

const stages: { key: string; label: string; color: string; leads: Lead[] }[] = [
  {
    key: "new",
    label: "New",
    color: "bg-muted-foreground",
    leads: [
      { id: "L-2401", name: "Diego Alvarez", trip: "ORD → Milwaukee", dates: "May 18 · 5 days", budget: "$1,120", urgency: "med", payment: "unpaid", agent: "RP", score: 72, tone: "blue" },
      { id: "L-2402", name: "Emma Liu", trip: "SFO → Napa Valley", dates: "May 22 · 3 days", budget: "$640", urgency: "low", payment: "unpaid", agent: "JM", score: 58, tone: "emerald" },
    ],
  },
  {
    key: "assigned",
    label: "Assigned",
    color: "bg-info",
    leads: [
      { id: "L-2403", name: "Marcus Reid", trip: "LAX → San Diego", dates: "May 14 · 4 days", budget: "$890", urgency: "high", payment: "unpaid", agent: "AK", score: 88, tone: "amber" },
      { id: "L-2404", name: "Hiroshi Tanaka", trip: "BOS → Cape Cod", dates: "May 17 · 6 days", budget: "$1,420", urgency: "med", payment: "pending", agent: "AK", score: 81, tone: "rose" },
    ],
  },
  {
    key: "contacted",
    label: "Contacted",
    color: "bg-secondary",
    leads: [
      { id: "L-2405", name: "Olivia Bennett", trip: "MIA → Key West", dates: "May 19 · 4 days", budget: "$980", urgency: "med", payment: "pending", agent: "JM", score: 76, tone: "violet" },
    ],
  },
  {
    key: "negotiating",
    label: "Negotiating",
    color: "bg-warning",
    leads: [
      { id: "L-2406", name: "Sarah Chen", trip: "JFK → Manhattan", dates: "May 12 · 6 days", budget: "$1,240", urgency: "high", payment: "pending", agent: "AK", score: 92, tone: "amber" },
      { id: "L-2407", name: "Emily Watson", trip: "SEA → Vancouver", dates: "May 20 · 7 days", budget: "$1,680", urgency: "med", payment: "pending", agent: "JM", score: 84, tone: "emerald" },
    ],
  },
  {
    key: "confirmed",
    label: "Confirmed",
    color: "bg-success",
    leads: [
      { id: "L-2408", name: "Priya Shah", trip: "YYZ → Niagara", dates: "May 16 · 3 days", budget: "$540", urgency: "low", payment: "paid", agent: "AK", score: 90, tone: "rose" },
    ],
  },
  {
    key: "completed",
    label: "Completed",
    color: "bg-primary",
    leads: [
      { id: "L-2409", name: "Daniel Park", trip: "DFW → Austin", dates: "May 04 · 5 days", budget: "$760", urgency: "low", payment: "paid", agent: "RP", score: 95, tone: "blue" },
    ],
  },
];

function LeadsPage() {
  return (
    <AppShell title="Leads">
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <div className="flex items-center gap-3 border-b border-border px-6 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Filter pipeline…" className="h-8 w-72 rounded-md border border-border bg-surface pl-8 pr-3 text-sm focus:outline-none" />
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground hover:bg-surface-2">
            <Filter className="h-3.5 w-3.5" /> All agents
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground hover:bg-surface-2">
            High urgency
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> New lead
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto scrollbar-thin">
          <div className="flex h-full min-w-max gap-3 p-4">
            {stages.map((s) => (
              <div key={s.key} className="flex w-[280px] shrink-0 flex-col rounded-xl border border-border bg-surface/40">
                <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${s.color}`} />
                    <span className="text-sm font-semibold text-foreground">{s.label}</span>
                    <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted-foreground">{s.leads.length}</span>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground"><Plus className="h-3.5 w-3.5" /></button>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto p-2 scrollbar-thin">
                  {s.leads.map((l) => <LeadCard key={l.id} l={l} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function LeadCard({ l }: { l: Lead }) {
  const urgencyTone = l.urgency === "high" ? "danger" : l.urgency === "med" ? "warning" : "neutral";
  const paymentTone = l.payment === "paid" ? "success" : l.payment === "pending" ? "warning" : "neutral";
  return (
    <Link
      to="/app/leads/$leadId"
      params={{ leadId: l.id }}
      className="group block cursor-pointer rounded-lg border border-border bg-surface p-3 transition hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg hover:shadow-black/30"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Avatar name={l.name} tone={l.tone} />
          <div>
            <div className="text-sm font-medium text-foreground">{l.name}</div>
            <div className="text-[11px] text-muted-foreground">{l.id}</div>
          </div>
        </div>
        <button className="opacity-0 transition group-hover:opacity-100"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button>
      </div>
      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        <div className="truncate text-foreground/90">{l.trip}</div>
        <div>{l.dates}</div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge tone={urgencyTone}>{l.urgency === "high" && <AlertTriangle className="h-3 w-3" />}{l.urgency.toUpperCase()}</Badge>
        <Badge tone={paymentTone}>{l.payment}</Badge>
        <Badge tone="primary"><Star className="h-2.5 w-2.5 fill-current" /> {l.score}</Badge>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
        <span className="text-sm font-semibold text-foreground">{l.budget}</span>
        <span className="grid h-5 w-5 place-items-center rounded-full bg-surface-2 text-[9px] font-semibold text-foreground">{l.agent}</span>
      </div>
    </Link>
  );
}
