import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { Avatar, Badge, Panel, PanelHeader } from "@/components/app/primitives";

export const Route = createFileRoute("/app/bookings")({
  head: () => ({ meta: [{ title: "Bookings — RentOps CRM" }] }),
  component: () => (
    <AppShell title="Bookings">
      <div className="p-6">
        <Panel>
          <PanelHeader title="All bookings" subtitle="Across providers and locations" />
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-5 py-2.5">Booking</th><th className="px-3 py-2.5">Customer</th><th className="px-3 py-2.5">Vehicle</th><th className="px-3 py-2.5">Provider</th><th className="px-3 py-2.5">Dates</th><th className="px-3 py-2.5">Total</th><th className="px-5 py-2.5">Status</th></tr>
            </thead>
            <tbody>
              {[
                ["BK-9821", "Sarah Chen", "Range Rover Sport", "Hertz", "May 12 → 18", "$1,240", "Confirmed", "success"],
                ["BK-9820", "Marcus Reid", "BMW 5 Series", "Sixt", "May 14 → 18", "$890", "Pending", "warning"],
                ["BK-9819", "Priya Shah", "Tesla Model Y", "Avis", "May 16 → 19", "$540", "Confirmed", "success"],
                ["BK-9818", "Diego Alvarez", "Audi A6", "Enterprise", "May 18 → 23", "$1,120", "Pending", "warning"],
                ["BK-9817", "Olivia Bennett", "Toyota GR86", "Budget", "May 19 → 23", "$980", "Confirmed", "success"],
              ].map((r: any) => (
                <tr key={r[0]} className="border-t border-border hover:bg-surface-2">
                  <td className="px-5 py-3 font-mono text-xs text-foreground">{r[0]}</td>
                  <td className="px-3 py-3"><div className="flex items-center gap-2"><Avatar name={r[1]} /><span className="text-foreground">{r[1]}</span></div></td>
                  <td className="px-3 py-3 text-foreground/90">{r[2]}</td>
                  <td className="px-3 py-3 text-muted-foreground">{r[3]}</td>
                  <td className="px-3 py-3 text-muted-foreground">{r[4]}</td>
                  <td className="px-3 py-3 font-medium text-foreground">{r[5]}</td>
                  <td className="px-5 py-3"><Badge tone={r[7]}>{r[6]}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </AppShell>
  ),
});
