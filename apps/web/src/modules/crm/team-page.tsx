"use client";

import { useLeadMetricsQuery } from "@/hooks/api/use-leads-api";
import { Users2 } from "lucide-react";
import { Avatar, Badge, CrmPage, EmptyState, Panel, PanelHeader } from "@/components/crm/primitives";

export function TeamPage() {
  const metricsQuery = useLeadMetricsQuery();
  const agents = metricsQuery.data?.activeAgents ?? [];

  return (
    <CrmPage title="Team">
      <div className="p-6">
        <Panel>
          <PanelHeader title="Active sales agents" subtitle="Loaded from live assignment metrics" />
          {metricsQuery.isLoading ? (
            <div className="p-6 text-sm text-[#637083]">Loading team…</div>
          ) : agents.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-medium uppercase text-[#637083]">
                  <th className="px-5 py-2.5">Agent</th>
                  <th className="px-3 py-2.5">Assigned leads</th>
                  <th className="px-3 py-2.5">Role</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id} className="border-t border-[#eef2f7]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={agent.name} />
                        <div>
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-xs text-[#637083]">{agent.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">{agent.current_lead_count}</td>
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
    </CrmPage>
  );
}
