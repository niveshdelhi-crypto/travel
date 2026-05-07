import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { Panel } from "@/components/app/primitives";
import { Bell, CheckCircle2, AlertTriangle, CircleDollarSign } from "lucide-react";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — RentOps CRM" }] }),
  component: () => (
    <AppShell title="Notifications">
      <div className="p-6">
        <Panel>
          <ul className="divide-y divide-border">
            {[
              { i: CheckCircle2, c: "success", t: "Booking BK-9821 confirmed", b: "Sarah Chen · $1,240", time: "2m ago" },
              { i: CircleDollarSign, c: "primary", t: "Payment received", b: "Olivia Bennett · $980", time: "12m ago" },
              { i: AlertTriangle, c: "warning", t: "Avis JFK SLA dipping below 80%", b: "Provider sync · operations", time: "32m ago" },
              { i: Bell, c: "info", t: "New lead assigned to you", b: "Diego Alvarez · ORD → Milwaukee", time: "1h ago" },
            ].map((n, i) => (
              <li key={i} className="flex items-start gap-3 px-5 py-4">
                <span className={`grid h-8 w-8 place-items-center rounded-md bg-${n.c}/10`}><n.i className={`h-4 w-4 text-${n.c}`} /></span>
                <div className="flex-1"><div className="text-sm font-medium text-foreground">{n.t}</div><div className="text-xs text-muted-foreground">{n.b}</div></div>
                <span className="text-[11px] text-muted-foreground">{n.time}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  ),
});
