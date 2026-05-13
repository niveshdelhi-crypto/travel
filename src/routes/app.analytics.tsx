import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app/app-shell";
import { EmptyState, Panel, PanelHeader, StatCard } from "@/components/app/primitives";
import { CircleDollarSign, TrendingUp, Users2 } from "lucide-react";
import { leadsService } from "@/services";

export const Route = createFileRoute("/app/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const metricsQuery = useQuery({ queryKey: ["leads", "metrics", "analytics"], queryFn: leadsService.metrics });
  const metrics = metricsQuery.data;

  return (
    <AppShell title="Analytics">
      <div className="space-y-6 p-6">
        {metrics ? (
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Lead revenue" value={currency(metrics.revenue)} icon={CircleDollarSign} />
            <StatCard label="Lead conversion" value={`${metrics.conversion}%`} icon={TrendingUp} />
            <StatCard label="Active agents" value={String(metrics.activeAgents.length)} icon={Users2} />
          </div>
        ) : null}
        <Panel>
          <PanelHeader title="Analytics scope" subtitle="Currently backed by persisted lead data only" />
          <EmptyState
            icon={TrendingUp}
            title={metricsQuery.isError ? "Analytics unavailable" : "Advanced analytics pending"}
            description="Revenue, conversion, call, provider, and booking analytics require additional database models before charts can be expanded."
          />
        </Panel>
      </div>
    </AppShell>
  );
}

function currency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}
