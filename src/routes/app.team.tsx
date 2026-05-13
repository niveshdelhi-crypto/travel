import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app/app-shell";
import { Avatar, Badge, EmptyState, Panel, PanelHeader } from "@/components/app/primitives";
import { Users2 } from "lucide-react";
import { leadsService } from "@/services";

export const Route = createFileRoute("/app/team")({
  component: TeamPage,
});

function TeamPage() {
  const metricsQuery = useQuery({ queryKey: ["leads", "metrics", "team"], queryFn: leadsService.metrics });
  const agents = metricsQuery.data?.activeAgents ?? [];

  return (
    <AppShell title="Team">
      <div className="p-6">
        <Panel>
          <PanelHeader title="Active sales agents" subtitle="Loaded from Prisma users" />
          {agents.length ? (
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5">Agent</th>
                  <th className="px-3 py-2.5">Assigned leads</th>
                  <th className="px-3 py-2.5">Role</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id} className="border-t border-border">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={agent.name} />
                        <div>
                          <div className="text-foreground">{agent.name}</div>
                          <div className="text-xs text-muted-foreground">{agent.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-foreground">{agent.current_lead_count}</td>
                    <td className="px-3 py-3">
                      <Badge tone="primary">sales_agent</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState
              icon={Users2}
              title={metricsQuery.isError ? "Team unavailable" : "No active agents"}
              description="Seed or activate sales agents to populate this view."
            />
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
