import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app/app-shell";
import { EmptyState, Panel, PanelHeader, StatCard } from "@/components/app/primitives";
import { requireAdminRoute } from "@/lib/route-guards";
import { analyticsService } from "@/services";
import { BarChart3, CircleDollarSign, Phone, Star, TrendingUp, Users2 } from "lucide-react";

export const Route = createFileRoute("/app/analytics")({
  beforeLoad: requireAdminRoute,
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const overviewQuery = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: () => analyticsService.overview(),
  });

  const data = overviewQuery.data;

  return (
    <AppShell title="Analytics">
      <div className="space-y-4 p-3 sm:space-y-6 sm:p-4 md:p-6">
        {overviewQuery.isError ? (
          <Panel>
            <EmptyState
              icon={BarChart3}
              title="Analytics unavailable"
              description="Admin analytics require a successful API response."
            />
          </Panel>
        ) : data ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Pipeline revenue"
                value={currency(data.leads.pipelineRevenue)}
                icon={CircleDollarSign}
              />
              <StatCard label="Lead conversion" value={`${data.leads.conversion}%`} icon={TrendingUp} />
              <StatCard label="Recognized payments" value={currency(data.payments.totalRecognized)} />
              <StatCard label="Total calls" value={String(data.calls.total)} icon={Phone} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel>
                <PanelHeader title="Lead pipeline" subtitle="Persisted status distribution" />
                <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:p-5 lg:grid-cols-5">
                  {Object.entries(data.leads.statusCounts).map(([status, count]) => (
                    <div key={status} className="rounded-lg border border-border bg-surface-2 p-4">
                      <p className="text-[10px] font-medium uppercase text-muted-foreground">
                        {status.toLowerCase()}
                      </p>
                      <p className="mt-2 text-2xl font-semibold">{count}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel>
                <PanelHeader title="Nurturing" subtitle="High-quality retention queue" />
                <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5">
                  <StatCard
                    label="High-quality leads"
                    value={String(data.leads.highQuality)}
                    icon={Star}
                  />
                  <StatCard
                    label="Retain within 7 days"
                    value={String(data.leads.retainDueWithin7Days)}
                    delta="Re-approach window"
                  />
                  <StatCard label="Bookings recorded" value={String(data.bookings.total)} />
                  <StatCard label="Active agents" value={String(data.team.activeAgents)} icon={Users2} />
                </div>
              </Panel>
            </div>

            <Panel>
              <PanelHeader title="Call outcomes" subtitle="Telephony sessions in database" />
              <div className="flex flex-wrap gap-3 p-5">
                {Object.entries(data.calls.byStatus).map(([status, count]) => (
                  <span
                    key={status}
                    className="rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">{status}: </span>
                    <strong>{count}</strong>
                  </span>
                ))}
                {Object.keys(data.calls.byStatus).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No calls logged yet.</p>
                ) : null}
              </div>
            </Panel>
          </>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-surface" />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
