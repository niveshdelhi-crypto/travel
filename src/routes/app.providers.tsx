import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { Badge, Panel } from "@/components/app/primitives";
import { Building2, Star } from "lucide-react";

export const Route = createFileRoute("/app/providers")({
  head: () => ({ meta: [{ title: "Providers — RentOps CRM" }] }),
  component: () => (
    <AppShell title="Providers">
      <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
        {[
          { n: "Hertz", v: 4218, fr: "98.4%", s: 4.9, t: "A+" },
          { n: "Enterprise", v: 3870, fr: "94.2%", s: 4.8, t: "A" },
          { n: "Sixt", v: 2210, fr: "92.7%", s: 4.8, t: "A" },
          { n: "Avis", v: 2902, fr: "89.1%", s: 4.7, t: "A-" },
          { n: "Budget", v: 1820, fr: "84.0%", s: 4.5, t: "B+" },
          { n: "Alamo", v: 1402, fr: "78.6%", s: 4.4, t: "B" },
        ].map((p) => (
          <Panel key={p.n} className="p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md border border-border bg-surface-2"><Building2 className="h-4 w-4 text-muted-foreground" /></div>
              <div className="flex-1">
                <div className="flex items-center gap-2"><span className="text-sm font-semibold text-foreground">{p.n}</span><Badge tone="primary">{p.t}</Badge></div>
                <div className="text-xs text-muted-foreground">{p.v.toLocaleString()} vehicles · Fill {p.fr}</div>
              </div>
              <div className="inline-flex items-center gap-1 text-sm font-semibold text-foreground"><Star className="h-3.5 w-3.5 fill-primary text-primary" /> {p.s}</div>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-gradient-to-r from-primary to-warning" style={{ width: p.fr }} /></div>
          </Panel>
        ))}
      </div>
    </AppShell>
  ),
});
