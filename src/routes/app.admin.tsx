import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app/app-shell";
import { Avatar, Badge, EmptyState, Panel, PanelHeader, SkeletonCard, StatCard } from "@/components/app/primitives";
import { Activity, Database, Server, Users2, Zap } from "lucide-react";
import { leadsService } from "@/services";
import { useAuthStore } from "@/store/auth.store";

export const Route = createFileRoute("/app/admin")({
  component: AdminOps,
});

function AdminOps() {
  const user = useAuthStore((state) => state.user);
  const metricsQuery = useQuery({
    queryKey: ["leads", "metrics", "admin"],
    queryFn: leadsService.metrics,
    enabled: user?.role === "admin",
  });

  if (user?.role !== "admin") {
    return <Navigate to="/app" replace />;
  }

  const metrics = metricsQuery.data;

  return (
    <AppShell title="Admin - Live operations">
      <div className="space-y-6 p-6">
        {metricsQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : metricsQuery.isError || !metrics ? (
          <Panel>
            <EmptyState
              icon={Database}
              title="Admin metrics unavailable"
              description="The authenticated admin metrics request failed."
            />
          </Panel>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="API status" value="Online" delta="auth required" trend="flat" icon={Server} />
            <StatCard label="Persisted leads" value={String(metrics.totalLeads)} icon={Database} />
            <StatCard label="Agents active" value={String(metrics.activeAgents.length)} icon={Users2} />
            <StatCard label="Realtime transport" value="Socket.IO" delta="process-local" trend="flat" icon={Zap} />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <Panel className="lg:col-span-2">
            <PanelHeader
              title="Lead operations"
              subtitle="Live values calculated from the Prisma database"
              right={<Badge tone="success">Protected</Badge>}
            />
            <div className="grid gap-3 p-5 sm:grid-cols-5">
              {metrics
                ? Object.entries(metrics.statusCounts).map(([status, count]) => (
                    <div key={status} className="rounded-lg border border-border bg-surface-2 p-4">
                      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {status.toLowerCase()}
                      </div>
                      <div className="mt-2 text-2xl font-semibold text-foreground">{count}</div>
                    </div>
                  ))
                : null}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Platform modules" subtitle="Database-backed status" />
            <ul className="divide-y divide-border">
              <ModuleStatus name="Auth" status="Operational" tone="success" />
              <ModuleStatus name="Leads" status="Operational" tone="success" />
              <ModuleStatus name="Realtime" status="Partial" tone="warning" />
              <ModuleStatus name="Calls" status="Schema pending" tone="warning" />
              <ModuleStatus name="Bookings" status="Schema pending" tone="warning" />
              <ModuleStatus name="Providers" status="Schema pending" tone="warning" />
            </ul>
          </Panel>
        </div>

        <Panel>
          <PanelHeader title="Agent supervision" subtitle="Active users from Prisma" />
          {metrics?.activeAgents.length ? (
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5">Agent</th>
                  <th className="px-3 py-2.5">Assigned lead count</th>
                  <th className="px-3 py-2.5">Role</th>
                </tr>
              </thead>
              <tbody>
                {metrics.activeAgents.map((agent) => (
                  <tr key={agent.id} className="border-t border-border hover:bg-surface-2">
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
                      <Badge tone="primary">
                        <Activity className="h-3 w-3" />
                        sales_agent
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="No active sales agents" description="Seed active agents before routing lead assignments." />
          )}
        </Panel>
      </div>
    </AppShell>
  );
}

function ModuleStatus({
  name,
  status,
  tone,
}: {
  name: string;
  status: string;
  tone: "success" | "warning";
}) {
  return (
    <li className="flex items-center justify-between px-5 py-3 text-sm">
      <span className="text-foreground">{name}</span>
      <Badge tone={tone}>{status}</Badge>
    </li>
  );
}
