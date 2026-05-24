"use client";

import { useLeadMetricsQuery } from "@/hooks/api/use-leads-api";
import { Activity, Database, Server, Users2, Zap } from "lucide-react";
import { Badge, CrmPage, EmptyState, Panel, PanelHeader, StatCard } from "@/components/crm/primitives";

export function AdminOpsPage() {
  const metricsQuery = useLeadMetricsQuery();
  const metrics = metricsQuery.data;

  return (
    <CrmPage title="Admin operations">
      <div className="space-y-6 p-6">
        {metricsQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-xl border border-[#d7dde8] bg-white" />
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
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="API status" value="Online" delta="auth required" icon={Server} />
              <StatCard label="Persisted leads" value={String(metrics.totalLeads)} icon={Database} />
              <StatCard
                label="Agents active"
                value={String(metrics.activeAgents.length)}
                icon={Users2}
              />
              <StatCard
                label="Realtime transport"
                value="Socket.IO"
                delta="process-local"
                icon={Zap}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Panel className="lg:col-span-2">
                <PanelHeader
                  title="Lead operations"
                  subtitle="Live values from the database"
                  right={<Badge tone="success">Protected</Badge>}
                />
                <div className="grid gap-3 p-5 sm:grid-cols-5">
                  {Object.entries(metrics.statusCounts).map(([status, count]) => (
                    <div key={status} className="rounded-lg border border-[#d7dde8] bg-[#f8fafc] p-4">
                      <div className="text-[10px] font-medium uppercase text-[#637083]">
                        {status.toLowerCase()}
                      </div>
                      <div className="mt-2 text-2xl font-semibold">{count}</div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel>
                <PanelHeader title="Platform modules" subtitle="Database-backed status" />
                <ul className="divide-y divide-[#eef2f7]">
                  <ModuleStatus name="Auth" status="Operational" tone="success" />
                  <ModuleStatus name="Leads" status="Operational" tone="success" />
                  <ModuleStatus name="Bookings" status="Operational" tone="success" />
                  <ModuleStatus name="Payments" status="Operational" tone="success" />
                  <ModuleStatus name="Calls" status="Vonage wired" tone="success" />
                  <ModuleStatus name="Realtime" status="Socket.IO" tone="warning" />
                </ul>
              </Panel>
            </div>
          </>
        )}
      </div>
    </CrmPage>
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
    <li className="flex items-center justify-between px-5 py-3.5">
      <span className="flex items-center gap-2 text-sm font-medium">
        <Activity className="h-4 w-4 text-[#637083]" />
        {name}
      </span>
      <Badge tone={tone}>{status}</Badge>
    </li>
  );
}
