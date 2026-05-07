import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { Avatar, Badge, Panel, PanelHeader, StatCard } from "@/components/app/primitives";
import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, PhoneCall, Play, Disc, Clock, Users2 } from "lucide-react";

export const Route = createFileRoute("/app/calls")({
  head: () => ({ meta: [{ title: "Calls — RentOps CRM" }] }),
  component: CallsPage,
});

function CallsPage() {
  return (
    <AppShell title="Cloud telephony">
      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Active calls" value="27" delta="Live" icon={PhoneCall} spark={[3,5,8,6,12,10,18,15,22,27]} />
          <StatCard label="Avg pickup" value="11.4s" delta="-2.1s" icon={Clock} spark={[18,16,15,14,13,12,12,11,11,11]} />
          <StatCard label="Missed today" value="14" delta="+3" trend="down" icon={PhoneMissed} spark={[5,6,8,9,10,11,12,12,13,14]} />
          <StatCard label="Agents online" value="38" delta="+4" icon={Users2} spark={[28,30,31,34,33,36,35,37,36,38]} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Panel className="lg:col-span-2">
            <PanelHeader title="Live calls" subtitle="Realtime telephony" right={<Badge tone="success">● Streaming</Badge>} />
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-5 py-2.5">Agent</th><th className="px-3 py-2.5">Customer</th><th className="px-3 py-2.5">Type</th><th className="px-3 py-2.5">Duration</th><th className="px-3 py-2.5">Status</th><th className="px-5"></th></tr>
              </thead>
              <tbody>
                {[
                  ["Alex Kim", "Sarah Chen", "Inbound", "02:34", "live", PhoneIncoming, "info"],
                  ["Jordan Mei", "Marcus Reid", "Outbound", "01:08", "live", PhoneOutgoing, "primary"],
                  ["Riya Patel", "Diego Alvarez", "Inbound", "00:42", "hold", Phone, "warning"],
                  ["Alex Kim", "Olivia Bennett", "Inbound", "00:15", "ringing", PhoneIncoming, "success"],
                ].map((r: any, i) => (
                  <tr key={i} className="border-t border-border hover:bg-surface-2">
                    <td className="px-5 py-3"><div className="flex items-center gap-2"><Avatar name={r[0]} /><span className="text-foreground">{r[0]}</span></div></td>
                    <td className="px-3 py-3 text-foreground/90">{r[1]}</td>
                    <td className="px-3 py-3 text-muted-foreground">{r[2]}</td>
                    <td className="px-3 py-3 font-mono text-foreground">{r[3]}</td>
                    <td className="px-3 py-3"><Badge tone={r[6]}><r[5] className="h-3 w-3" />{r[4]}</Badge></td>
                    <td className="px-5 text-right"><button className="text-xs font-medium text-primary hover:underline">Listen</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel>
            <PanelHeader title="Agent activity" />
            <ul className="divide-y divide-border">
              {[
                { n: "Alex Kim", st: "On call · Sarah Chen", t: "success" },
                { n: "Jordan Mei", st: "Wrap-up · 00:42", t: "warning" },
                { n: "Riya Patel", st: "Available", t: "info" },
                { n: "Sam Weller", st: "Break · 14m", t: "neutral" },
              ].map((a) => (
                <li key={a.n} className="flex items-center gap-3 px-5 py-3.5">
                  <Avatar name={a.n} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">{a.n}</div>
                    <div className="text-xs text-muted-foreground">{a.st}</div>
                  </div>
                  <Badge tone={a.t as any}>{a.t}</Badge>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel>
          <PanelHeader title="Recent recordings" subtitle="Last 24 hours" />
          <ul className="divide-y divide-border">
            {[
              ["Sarah Chen", "Negotiation · Premium SUV", "06:22", "10 min ago"],
              ["Marcus Reid", "Booking confirmation", "03:14", "32 min ago"],
              ["Priya Shah", "Customer support", "08:51", "1 hr ago"],
              ["Diego Alvarez", "Discovery call", "12:04", "2 hr ago"],
            ].map(([n, t, d, ago]) => (
              <li key={n} className="flex items-center gap-3 px-5 py-3">
                <button className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground"><Play className="h-3.5 w-3.5" /></button>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground">{n}</div>
                  <div className="text-xs text-muted-foreground">{t}</div>
                </div>
                <div className="hidden h-6 w-40 items-end gap-0.5 md:flex">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <span key={i} className="w-1 rounded-sm bg-primary/60" style={{ height: `${20 + Math.abs(Math.sin(i / 2)) * 70}%` }} />
                  ))}
                </div>
                <div className="font-mono text-xs text-foreground">{d}</div>
                <div className="text-xs text-muted-foreground">{ago}</div>
                <Disc className="h-3.5 w-3.5 text-destructive" />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
