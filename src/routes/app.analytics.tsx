import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { Panel, PanelHeader, StatCard, Badge } from "@/components/app/primitives";
import { CircleDollarSign, Phone, TrendingUp, Users2 } from "lucide-react";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — RentOps CRM" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <AppShell title="Analytics">
      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Revenue" value="$1.84M" delta="+14.2%" icon={CircleDollarSign} spark={[40,55,52,68,72,80,88,92,98,110]} />
          <StatCard label="Conversion" value="34.6%" delta="+2.1%" icon={TrendingUp} spark={[20,22,21,26,24,28,30,32,33,35]} />
          <StatCard label="Calls handled" value="14,208" delta="+8.4%" icon={Phone} spark={[80,85,90,95,100,105,108,112,118,124]} />
          <StatCard label="Active agents" value="38" delta="+4" icon={Users2} spark={[28,30,31,34,33,36,35,37,36,38]} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Panel className="lg:col-span-2">
            <PanelHeader title="Revenue trend" subtitle="Last 12 weeks" />
            <BigChart />
          </Panel>
          <Panel>
            <PanelHeader title="Conversion funnel" />
            <div className="space-y-3 p-5">
              {[
                ["Visitors", 100, "primary"],
                ["Search", 72, "info"],
                ["Lead", 48, "warning"],
                ["Quote", 30, "success"],
                ["Booked", 18, "primary"],
              ].map(([l, v, t]: any) => (
                <div key={l}>
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground"><span>{l}</span><span className="font-medium text-foreground">{v}%</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-2"><div className={`h-full bg-gradient-to-r from-primary to-warning`} style={{ width: `${v}%` }} /></div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <PanelHeader title="Booking heatmap" subtitle="Bookings by day & hour" />
            <Heatmap />
          </Panel>
          <Panel>
            <PanelHeader title="Provider performance" />
            <ul className="divide-y divide-border">
              {[
                { n: "Hertz", v: "98.4%", b: 86, score: "A+" },
                { n: "Enterprise", v: "94.2%", b: 78, score: "A" },
                { n: "Sixt", v: "92.7%", b: 70, score: "A" },
                { n: "Avis", v: "89.1%", b: 64, score: "A-" },
                { n: "Budget", v: "84.0%", b: 56, score: "B+" },
                { n: "Alamo", v: "78.6%", b: 48, score: "B" },
              ].map((p) => (
                <li key={p.n} className="px-5 py-3.5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">{p.n} <Badge tone="primary">{p.score}</Badge></div>
                    <span className="text-xs text-muted-foreground">{p.v}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-warning" style={{ width: `${p.b}%` }} />
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

function BigChart() {
  const series = [40,55,52,68,72,80,88,92,98,110,118,132];
  const w = 800, h = 280, pad = 28;
  const max = 140;
  const stepX = (w - pad * 2) / (series.length - 1);
  const yToPx = (v: number) => h - pad - (v / max) * (h - pad * 2);
  const linePath = series.map((v, i) => `${i === 0 ? "M" : "L"} ${pad + i * stepX} ${yToPx(v)}`).join(" ");
  const areaPath = `${linePath} L ${pad + (series.length - 1) * stepX} ${h - pad} L ${pad} ${h - pad} Z`;
  return (
    <div className="p-5">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-72 w-full">
        <defs>
          <linearGradient id="big" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.86 0.17 92)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="oklch(0.86 0.17 92)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0,1,2,3,4].map((i) => (
          <line key={i} x1={pad} x2={w-pad} y1={pad + (i*(h-pad*2))/4} y2={pad + (i*(h-pad*2))/4} stroke="oklch(1 0 0 / 0.05)" />
        ))}
        <path d={areaPath} fill="url(#big)" />
        <path d={linePath} stroke="oklch(0.86 0.17 92)" strokeWidth="2" fill="none" />
      </svg>
    </div>
  );
}

function Heatmap() {
  const days = ["M","T","W","T","F","S","S"];
  return (
    <div className="p-5">
      <div className="grid grid-cols-[auto_repeat(24,1fr)] gap-0.5 text-[9px] text-muted-foreground">
        <div></div>
        {Array.from({ length: 24 }).map((_, h) => (
          <div key={h} className="text-center">{h % 4 === 0 ? h : ""}</div>
        ))}
        {days.map((d, i) => (
          <div key={i} className="contents">
            <div className="pr-1 text-right">{d}</div>
            {Array.from({ length: 24 }).map((_, h) => {
              const v = (Math.sin((i + 1) * (h + 1) * 0.21) + 1) / 2;
              const op = 0.08 + v * 0.85;
              return <div key={h} className="aspect-square rounded-sm" style={{ background: `oklch(0.86 0.17 92 / ${op})` }} />;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
