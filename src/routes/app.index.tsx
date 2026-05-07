import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { Panel, PanelHeader, StatCard, Badge, Avatar } from "@/components/app/primitives";
import {
  ArrowUpRight,
  CalendarCheck,
  CircleDollarSign,
  Phone,
  TrendingUp,
  UserPlus,
  Users2,
  PhoneIncoming,
  PhoneOff,
  PhoneCall,
  MoreHorizontal,
  Filter,
} from "lucide-react";

export const Route = createFileRoute("/app/")({
    component: Dashboard,
});

function Dashboard() {
  return (
    <AppShell title="Dashboard">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back, Alex — here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-2">
              <Filter className="h-3.5 w-3.5" /> Last 7 days
            </button>
            <button className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
              <UserPlus className="h-3.5 w-3.5" /> New lead
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Total leads" value="4,238" delta="+12.4%" icon={Users2} spark={[12, 18, 14, 22, 28, 24, 32, 36, 30, 42]} />
          <StatCard label="Active calls" value="27" delta="Live" icon={Phone} spark={[3, 5, 8, 6, 12, 10, 18, 15, 22, 27]} />
          <StatCard label="Revenue" value="$284k" delta="+8.2%" icon={CircleDollarSign} spark={[40, 60, 55, 70, 65, 80, 75, 90, 88, 102]} />
          <StatCard label="Conversion" value="34.6%" delta="+2.1%" icon={TrendingUp} spark={[20, 22, 21, 26, 24, 28, 30, 32, 33, 35]} />
          <StatCard label="Pending bookings" value="142" delta="-3.4%" trend="down" icon={CalendarCheck} spark={[150, 144, 152, 148, 145, 142, 138, 144, 140, 142]} />
          <StatCard label="Active agents" value="38" delta="+4" icon={Users2} spark={[28, 30, 31, 34, 33, 36, 35, 37, 36, 38]} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Panel className="lg:col-span-2">
            <PanelHeader
              title="Revenue & bookings"
              subtitle="Daily revenue across all providers"
              right={
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-primary" /> Revenue</span>
                  <span className="ml-3 inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-secondary" /> Bookings</span>
                </div>
              }
            />
            <RevenueChart />
          </Panel>

          <Panel>
            <PanelHeader title="Live calls" subtitle="Realtime telephony activity" right={<Badge tone="success">● Live</Badge>} />
            <ul className="divide-y divide-border">
              {[
                { n: "Marcus Reid", st: "Inbound · 02:34", t: "info", icon: PhoneIncoming },
                { n: "Sarah Chen", st: "Outbound · 01:08", t: "primary", icon: PhoneCall },
                { n: "Diego Alvarez", st: "Hold · 00:42", t: "warning", icon: Phone },
                { n: "Priya Shah", st: "Wrap-up", t: "neutral", icon: PhoneOff },
              ].map((c) => (
                <li key={c.n} className="flex items-center gap-3 px-5 py-3.5">
                  <Avatar name={c.n} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{c.n}</div>
                    <div className="truncate text-xs text-muted-foreground">{c.st}</div>
                  </div>
                  <c.icon className="h-4 w-4 text-muted-foreground" />
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Panel className="lg:col-span-2">
            <PanelHeader
              title="Recent leads"
              subtitle="Latest inbound and assigned"
              right={
                <Link to="/app/leads" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  View all <ArrowUpRight className="h-3 w-3" />
                </Link>
              }
            />
            <LeadsTable />
          </Panel>

          <Panel>
            <PanelHeader title="Top providers" subtitle="By fill rate this week" />
            <ul className="divide-y divide-border">
              {[
                { n: "Hertz", v: "98.4%", b: 86 },
                { n: "Enterprise", v: "94.2%", b: 78 },
                { n: "Sixt", v: "92.7%", b: 70 },
                { n: "Avis", v: "89.1%", b: 64 },
                { n: "Budget", v: "84.0%", b: 56 },
              ].map((p) => (
                <li key={p.n} className="px-5 py-3.5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{p.n}</span>
                    <span className="text-xs text-muted-foreground">{p.v}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-warning"
                      style={{ width: `${p.b}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function RevenueChart() {
  const data = [
    [42, 30], [55, 38], [48, 32], [70, 50], [82, 60], [76, 55], [92, 68],
    [88, 64], [102, 74], [96, 70], [115, 82], [108, 78], [125, 92], [132, 98],
  ];
  const w = 760, h = 240, pad = 24;
  const max = 140;
  const stepX = (w - pad * 2) / (data.length - 1);
  const yToPx = (v: number) => h - pad - (v / max) * (h - pad * 2);
  const linePath = (idx: 0 | 1) => data.map(([a, b], i) => `${i === 0 ? "M" : "L"} ${pad + i * stepX} ${yToPx(idx === 0 ? a : b)}`).join(" ");
  const areaPath = (idx: 0 | 1) => `${linePath(idx)} L ${pad + (data.length - 1) * stepX} ${h - pad} L ${pad} ${h - pad} Z`;

  return (
    <div className="p-5">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-60 w-full">
        <defs>
          <linearGradient id="rev" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.86 0.17 92)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="oklch(0.86 0.17 92)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="bk" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.55 0.21 263)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="oklch(0.55 0.21 263)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1={pad}
            x2={w - pad}
            y1={pad + (i * (h - pad * 2)) / 3}
            y2={pad + (i * (h - pad * 2)) / 3}
            stroke="oklch(1 0 0 / 0.05)"
          />
        ))}
        <path d={areaPath(0)} fill="url(#rev)" />
        <path d={areaPath(1)} fill="url(#bk)" />
        <path d={linePath(1)} stroke="oklch(0.55 0.21 263)" strokeWidth="2" fill="none" />
        <path d={linePath(0)} stroke="oklch(0.86 0.17 92)" strokeWidth="2" fill="none" />
        {data.map(([a], i) => (
          <circle key={i} cx={pad + i * stepX} cy={yToPx(a)} r="2.5" fill="oklch(0.86 0.17 92)" />
        ))}
      </svg>
    </div>
  );
}

function LeadsTable() {
  const rows = [
    { c: "Sarah Chen", l: "JFK → Manhattan", d: "May 12 · 6 days", b: "$1,240", s: "Negotiating", t: "warning", a: "AK" },
    { c: "Marcus Reid", l: "LAX → San Diego", d: "May 14 · 4 days", b: "$890", s: "Contacted", t: "info", a: "JM" },
    { c: "Priya Shah", l: "YYZ → Niagara", d: "May 16 · 3 days", b: "$540", s: "Confirmed", t: "success", a: "AK" },
    { c: "Diego Alvarez", l: "ORD → Milwaukee", d: "May 18 · 5 days", b: "$1,120", s: "New", t: "neutral", a: "RP" },
    { c: "Emily Watson", l: "SEA → Vancouver", d: "May 20 · 7 days", b: "$1,680", s: "Negotiating", t: "warning", a: "JM" },
  ] as const;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <th className="px-5 py-2.5 font-medium">Customer</th>
          <th className="px-3 py-2.5 font-medium">Trip</th>
          <th className="px-3 py-2.5 font-medium">Budget</th>
          <th className="px-3 py-2.5 font-medium">Status</th>
          <th className="px-3 py-2.5 font-medium">Agent</th>
          <th className="px-5 py-2.5"></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.c} className="border-t border-border transition hover:bg-surface-2">
            <td className="px-5 py-3">
              <div className="flex items-center gap-3">
                <Avatar name={r.c} />
                <div>
                  <div className="font-medium text-foreground">{r.c}</div>
                  <div className="text-xs text-muted-foreground">{r.l}</div>
                </div>
              </div>
            </td>
            <td className="px-3 py-3 text-muted-foreground">{r.d}</td>
            <td className="px-3 py-3 font-medium text-foreground">{r.b}</td>
            <td className="px-3 py-3"><Badge tone={r.t as any}>{r.s}</Badge></td>
            <td className="px-3 py-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-surface-2 text-[10px] font-medium text-foreground">{r.a}</span></td>
            <td className="px-5 py-3 text-right">
              <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
