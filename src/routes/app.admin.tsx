import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { Avatar, Badge, Panel, PanelHeader, StatCard } from "@/components/app/primitives";
import { Activity, AlertTriangle, CheckCircle2, Phone, Server, Users2, Zap } from "lucide-react";

export const Route = createFileRoute("/app/admin")({
    component: AdminOps,
});

function AdminOps() {
  return (
    <AppShell title="Admin · Live operations">
      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="System uptime" value="99.98%" delta="30d" icon={Server} spark={[99,99,99,100,100,99,100,100,100,100]} />
          <StatCard label="Live calls" value="27" delta="Live" icon={Phone} spark={[3,5,8,6,12,10,18,15,22,27]} />
          <StatCard label="Agents online" value="38 / 42" delta="90%" icon={Users2} spark={[28,30,31,34,33,36,35,37,36,38]} />
          <StatCard label="API latency" value="84ms" delta="-6ms" icon={Zap} spark={[120,110,100,98,95,92,90,88,86,84]} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Panel className="lg:col-span-2">
            <PanelHeader title="Live activity feed" right={<Badge tone="success">● Streaming</Badge>} />
            <ol className="relative px-5 py-4">
              <span className="absolute left-[22px] top-4 bottom-4 w-px bg-border" />
              {[
                { i: CheckCircle2, c: "success", t: "Booking confirmed", b: "Sarah Chen · Hertz JFK · $1,240", time: "Just now" },
                { i: Phone, c: "info", t: "Call connected", b: "Agent Alex Kim ↔ Marcus Reid", time: "12s ago" },
                { i: Activity, c: "primary", t: "Lead assigned", b: "Diego Alvarez → Riya Patel (auto)", time: "30s ago" },
                { i: AlertTriangle, c: "warning", t: "Provider SLA dipping", b: "Avis JFK fill rate 78% (last 30m)", time: "2m ago" },
                { i: CheckCircle2, c: "success", t: "Payment received", b: "Olivia Bennett · $980", time: "3m ago" },
                { i: Phone, c: "info", t: "Inbound call", b: "Routed to Jordan Mei", time: "4m ago" },
              ].map((e, i) => (
                <li key={i} className="relative flex gap-3 py-2.5">
                  <span className={`relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border bg-${e.c}/10`}>
                    <e.i className={`h-3 w-3 text-${e.c}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-foreground">{e.t}</div>
                    <div className="text-[11px] text-muted-foreground">{e.b}</div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{e.time}</span>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel>
            <PanelHeader title="System health" />
            <ul className="divide-y divide-border">
              {[
                ["Telephony", "Operational", "success"],
                ["Payments", "Operational", "success"],
                ["Provider sync", "Degraded", "warning"],
                ["Search index", "Operational", "success"],
                ["Notifications", "Operational", "success"],
              ].map(([n, s, t]: any) => (
                <li key={n} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-foreground">{n}</span>
                  <Badge tone={t}>{s}</Badge>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel>
          <PanelHeader title="Agent supervision" subtitle="Live agent monitoring & call quality" />
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-5 py-2.5">Agent</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Calls today</th><th className="px-3 py-2.5">Conv. rate</th><th className="px-3 py-2.5">Avg handle</th><th className="px-3 py-2.5">Quality</th><th className="px-5"></th></tr>
            </thead>
            <tbody>
              {[
                ["Alex Kim", "On call", "success", 38, "42%", "4:18", 96],
                ["Jordan Mei", "Available", "info", 29, "37%", "5:02", 92],
                ["Riya Patel", "Wrap-up", "warning", 31, "34%", "4:48", 89],
                ["Sam Weller", "Break", "neutral", 22, "29%", "5:12", 85],
              ].map((r: any) => (
                <tr key={r[0]} className="border-t border-border hover:bg-surface-2">
                  <td className="px-5 py-3"><div className="flex items-center gap-2"><Avatar name={r[0]} /><span className="text-foreground">{r[0]}</span></div></td>
                  <td className="px-3 py-3"><Badge tone={r[2]}>{r[1]}</Badge></td>
                  <td className="px-3 py-3 text-foreground">{r[3]}</td>
                  <td className="px-3 py-3 text-foreground">{r[4]}</td>
                  <td className="px-3 py-3 font-mono text-foreground">{r[5]}</td>
                  <td className="px-3 py-3"><div className="flex items-center gap-2"><div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-success" style={{ width: `${r[6]}%` }} /></div><span className="text-xs text-foreground">{r[6]}</span></div></td>
                  <td className="px-5 py-3 text-right"><button className="text-xs font-medium text-primary hover:underline">Listen in</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </AppShell>
  );
}
