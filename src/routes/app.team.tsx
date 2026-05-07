import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import {
  Avatar,
  Badge,
  Panel,
  PanelHeader,
  StatCard,
  ProgressBar,
  StatusDot,
  EmptyState,
} from "@/components/app/primitives";
import {
  Users2,
  UserPlus,
  Phone,
  MoreHorizontal,
  Mail,
  Shield,
  TrendingUp,
  Clock,
  Search,
  Filter,
  ChevronDown,
} from "lucide-react";
import type { Agent } from "@/types";

export const Route = createFileRoute("/app/team")({
  head: () => ({ meta: [{ title: "Team — FleetNexus CRM" }] }),
  component: TeamPage,
});

const team: Agent[] = [
  { id: "a1", name: "Alex Kim",      initials: "AK", role: "Senior Sales Rep", status: "on_call",   callsToday: 38, conversionRate: 42, avgHandleTime: "4:18", qualityScore: 96, lastActive: "Now",    email: "alex.kim@fleetnexus.io",    phoneExtension: "201" },
  { id: "a2", name: "Jordan Mei",    initials: "JM", role: "Sales Rep",        status: "wrap_up",   callsToday: 29, conversionRate: 37, avgHandleTime: "5:02", qualityScore: 92, lastActive: "2m ago", email: "jordan.mei@fleetnexus.io",  phoneExtension: "202" },
  { id: "a3", name: "Riya Patel",    initials: "RP", role: "Team Lead",        status: "available", callsToday: 31, conversionRate: 34, avgHandleTime: "4:48", qualityScore: 89, lastActive: "5m ago", email: "riya.patel@fleetnexus.io",  phoneExtension: "203" },
  { id: "a4", name: "Sam Weller",    initials: "SW", role: "Sales Rep",        status: "break",     callsToday: 22, conversionRate: 29, avgHandleTime: "5:12", qualityScore: 85, lastActive: "14m ago", email: "sam.weller@fleetnexus.io",  phoneExtension: "204" },
  { id: "a5", name: "Mira Osei",     initials: "MO", role: "Operations",       status: "available", callsToday: 18, conversionRate: 31, avgHandleTime: "4:35", qualityScore: 88, lastActive: "1m ago", email: "mira.osei@fleetnexus.io",   phoneExtension: "205" },
  { id: "a6", name: "Carlos Vega",   initials: "CV", role: "Sales Rep",        status: "offline",   callsToday: 0,  conversionRate: 33, avgHandleTime: "4:55", qualityScore: 86, lastActive: "3h ago", email: "carlos.vega@fleetnexus.io", phoneExtension: "206" },
];

const STATUS_LABELS = {
  available: "Available",
  on_call:   "On call",
  wrap_up:   "Wrap-up",
  break:     "Break",
  offline:   "Offline",
} as const;

const STATUS_TONES = {
  available: "success",
  on_call:   "info",
  wrap_up:   "warning",
  break:     "neutral",
  offline:   "neutral",
} as const;

const ROLE_TONE: Record<string, "primary" | "info" | "neutral"> = {
  "Team Lead":        "primary",
  "Senior Sales Rep": "info",
  "Sales Rep":        "neutral",
  "Operations":       "neutral",
};

function TeamPage() {
  const online  = team.filter((a) => a.status !== "offline").length;
  const onCall  = team.filter((a) => a.status === "on_call").length;
  const avgConv = Math.round(team.reduce((s, a) => s + a.conversionRate, 0) / team.length);
  const avgQual = Math.round(team.reduce((s, a) => s + a.qualityScore, 0) / team.length);

  return (
    <AppShell title="Team">
      <div className="space-y-6 p-6">
        {/* KPI row */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total agents"  value={String(team.length)} delta="+2 this month" icon={Users2}     spark={[30,32,32,34,34,36,36,36,36,38]} />
          <StatCard label="Online now"    value={String(online)}      delta="Live"          icon={Shield}     spark={[25,28,28,30,30,32,32,32,32,32]} />
          <StatCard label="On call"       value={String(onCall)}      delta="Active"        icon={Phone}      spark={[1,2,2,3,2,3,3,2,3,1]} />
          <StatCard label="Avg conv. rate" value={`${avgConv}%`}      delta="+3.2%"         icon={TrendingUp} spark={[28,30,31,32,33,34,34,35,35,36]} />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search team members…"
              className="h-8 w-64 rounded-md border border-border bg-surface pl-8 pr-3 text-sm focus:outline-none"
            />
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs hover:bg-surface-2">
            <Filter className="h-3.5 w-3.5" /> All roles
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs hover:bg-surface-2">
            All statuses <ChevronDown className="h-3 w-3" />
          </button>
          <div className="ml-auto">
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
              <UserPlus className="h-3.5 w-3.5" /> Invite member
            </button>
          </div>
        </div>

        {/* Agent cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {team.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>

        {/* Full table */}
        <Panel>
          <PanelHeader
            title="Agent performance table"
            subtitle="Calls, conversion, handle time and quality metrics"
          />
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-2.5">Member</th>
                <th className="px-3 py-2.5">Role</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Calls today</th>
                <th className="px-3 py-2.5">Conv. rate</th>
                <th className="px-3 py-2.5">Avg handle</th>
                <th className="px-3 py-2.5">Quality</th>
                <th className="px-5 py-2.5">Last active</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {team.map((a) => (
                <tr key={a.id} className="border-t border-border hover:bg-surface-2">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <Avatar name={a.name} />
                        <StatusDot
                          status={a.status}
                          className="absolute -bottom-0.5 -right-0.5"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{a.name}</div>
                        <div className="text-[11px] text-muted-foreground">{a.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={ROLE_TONE[a.role] ?? "neutral"}>{a.role}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={STATUS_TONES[a.status]}>
                      <StatusDot status={a.status} />
                      {STATUS_LABELS[a.status]}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-foreground">{a.callsToday}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={a.conversionRate} className="w-16" />
                      <span className="text-xs text-foreground">{a.conversionRate}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-foreground">{a.avgHandleTime}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <ProgressBar
                        value={a.qualityScore}
                        tone={a.qualityScore >= 90 ? "success" : "primary"}
                        className="w-16"
                      />
                      <span className="text-xs text-foreground">{a.qualityScore}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{a.lastActive}</td>
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

function AgentCard({ agent: a }: { agent: Agent }) {
  return (
    <div className="group rounded-xl border border-border bg-surface p-5 transition hover:border-border-strong">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar name={a.name} size="md" />
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface ${
                { available: "bg-success", on_call: "bg-info", wrap_up: "bg-warning", break: "bg-muted-foreground", offline: "bg-destructive" }[a.status]
              }`}
            />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{a.name}</div>
            <div className="text-xs text-muted-foreground">{a.role}</div>
          </div>
        </div>
        <Badge tone={STATUS_TONES[a.status]}>{STATUS_LABELS[a.status]}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-border bg-surface-2 p-2">
          <div className="text-sm font-semibold text-foreground">{a.callsToday}</div>
          <div className="text-[10px] text-muted-foreground">Calls</div>
        </div>
        <div className="rounded-lg border border-border bg-surface-2 p-2">
          <div className="text-sm font-semibold text-foreground">{a.conversionRate}%</div>
          <div className="text-[10px] text-muted-foreground">Conv.</div>
        </div>
        <div className="rounded-lg border border-border bg-surface-2 p-2">
          <div className="text-sm font-semibold text-foreground">{a.qualityScore}</div>
          <div className="text-[10px] text-muted-foreground">Quality</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-[11px] text-muted-foreground">
          <span>Quality score</span>
          <span>{a.qualityScore}/100</span>
        </div>
        <ProgressBar
          value={a.qualityScore}
          tone={a.qualityScore >= 90 ? "success" : a.qualityScore >= 80 ? "primary" : "warning"}
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{a.lastActive}</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="grid h-7 w-7 place-items-center rounded-md border border-border bg-surface-2 text-muted-foreground hover:text-foreground" title="Call">
            <Phone className="h-3.5 w-3.5" />
          </button>
          <button className="grid h-7 w-7 place-items-center rounded-md border border-border bg-surface-2 text-muted-foreground hover:text-foreground" title="Email">
            <Mail className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
