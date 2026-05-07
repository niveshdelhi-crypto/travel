import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { Avatar, Badge, Panel } from "@/components/app/primitives";

export const Route = createFileRoute("/app/team")({
  head: () => ({ meta: [{ title: "Team — RentOps CRM" }] }),
  component: () => (
    <AppShell title="Team">
      <div className="p-6">
        <Panel>
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-5 py-2.5">Member</th><th className="px-3 py-2.5">Role</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Performance</th><th className="px-5 py-2.5">Last active</th></tr>
            </thead>
            <tbody>
              {[
                ["Alex Kim", "Senior Sales Rep", "Online", "success", 96],
                ["Jordan Mei", "Sales Rep", "Online", "info", 89],
                ["Riya Patel", "Team Lead", "Wrap-up", "warning", 92],
                ["Sam Weller", "Sales Rep", "Break", "neutral", 81],
                ["Mira Osei", "Operations", "Online", "info", 88],
              ].map((r: any) => (
                <tr key={r[0]} className="border-t border-border hover:bg-surface-2">
                  <td className="px-5 py-3"><div className="flex items-center gap-2"><Avatar name={r[0]} /><span className="text-foreground">{r[0]}</span></div></td>
                  <td className="px-3 py-3 text-muted-foreground">{r[1]}</td>
                  <td className="px-3 py-3"><Badge tone={r[3]}>{r[2]}</Badge></td>
                  <td className="px-3 py-3"><div className="flex items-center gap-2"><div className="h-1.5 w-32 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-gradient-to-r from-primary to-warning" style={{ width: `${r[4]}%` }} /></div><span className="text-xs text-foreground">{r[4]}</span></div></td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">2 min ago</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </AppShell>
  ),
});
