import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app/app-shell";
import {
  Avatar,
  Badge,
  EmptyState,
  Panel,
  PanelHeader,
  SkeletonCard,
  StatCard,
} from "@/components/app/primitives";
import { CalendarCheck, CircleDollarSign, Phone, TrendingUp, Users2, ArrowUpRight } from "lucide-react";
import { leadsService, type BackendLead, type BackendLeadStatus } from "@/services";
import { useAuthStore } from "@/store/auth.store";
import type { BadgeTone } from "@/types";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

const statusOrder: BackendLeadStatus[] = ["NEW", "CONTACTED", "NEGOTIATING", "CONFIRMED", "COMPLETED"];

function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";
  const metricsQuery = useQuery({
    queryKey: ["leads", "metrics"],
    queryFn: leadsService.metrics,
  });
  const leadsQuery = useQuery({
    queryKey: ["leads", isAdmin ? "admin" : "my", { page: 1, pageSize: 5 }],
    queryFn: () =>
      isAdmin
        ? leadsService.admin({ page: 1, pageSize: 5 })
        : leadsService.my({ page: 1, pageSize: 5 }),
    enabled: Boolean(user),
  });

  const metrics = metricsQuery.data;
  const spark = metrics ? statusOrder.map((status) => metrics.statusCounts[status] ?? 0) : undefined;

  return (
    <AppShell title="Dashboard">
      <div className="space-y-4 p-3 sm:space-y-6 sm:p-4 md:p-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Welcome back{user?.name ? `, ${user.name}` : ""}. Live operational data is loaded from
            Book my Carz APIs.
          </p>
        </div>

        {metricsQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : metricsQuery.isError || !metrics ? (
          <Panel>
            <EmptyState
              icon={TrendingUp}
              title="Unable to load dashboard metrics"
              description="The authenticated metrics API did not respond successfully."
            />
          </Panel>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Total leads" value={String(metrics.totalLeads)} icon={Users2} spark={spark} />
            <StatCard label="Active calls" value={String(metrics.activeCalls)} delta="module pending" trend="flat" icon={Phone} />
            <StatCard
              label="Revenue"
              value={currency(metrics.revenue)}
              delta="confirmed/completed"
              trend="flat"
              icon={CircleDollarSign}
            />
            <StatCard label="Conversion" value={`${metrics.conversion}%`} icon={TrendingUp} spark={spark} />
            <StatCard label="Bookings" value={String(metrics.bookings)} delta="from lead status" trend="flat" icon={CalendarCheck} />
            <StatCard label="Active agents" value={String(metrics.activeAgents.length)} icon={Users2} />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <Panel className="lg:col-span-2">
            <PanelHeader
              title="Lead status distribution"
              subtitle="Calculated from persisted Prisma lead records"
            />
            <StatusDistribution counts={metrics?.statusCounts} />
          </Panel>

          <Panel>
            <PanelHeader title="Active agents" subtitle="Lowest-load assignment pool" />
            {metrics?.activeAgents.length ? (
              <ul className="divide-y divide-border">
                {metrics.activeAgents.map((agent) => (
                  <li key={agent.id} className="flex items-center gap-3 px-5 py-3.5">
                    <Avatar name={agent.name} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{agent.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{agent.email}</div>
                    </div>
                    <Badge tone="primary">{agent.current_lead_count} leads</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No active agents" description="Seed or activate sales agents to assign leads." />
            )}
          </Panel>
        </div>

        <Panel>
          <PanelHeader
            title="Recent leads"
            subtitle={isAdmin ? "Latest inbound leads across all agents" : "Latest leads assigned to you"}
            right={
              <Link
                to={isAdmin ? "/app/leads" : "/app/workspace"}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            }
          />
          {leadsQuery.isLoading ? (
            <div className="grid gap-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-12 rounded-md bg-surface-2 shimmer" />
              ))}
            </div>
          ) : leadsQuery.data?.data.length ? (
            <LeadsTable leads={leadsQuery.data.data} />
          ) : (
            <EmptyState title="No leads yet" description="New landing-page requests will appear here after assignment." />
          )}
        </Panel>
      </div>
    </AppShell>
  );
}

function StatusDistribution({ counts }: { counts?: Record<BackendLeadStatus, number> }) {
  const total = counts ? Object.values(counts).reduce((sum, count) => sum + count, 0) : 0;

  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:p-5 lg:grid-cols-5">
      {statusOrder.map((status) => {
        const count = counts?.[status] ?? 0;
        const pct = total === 0 ? 0 : Math.round((count / total) * 100);

        return (
          <div key={status} className="rounded-lg border border-border bg-surface-2 p-4">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {statusLabel(status)}
            </div>
            <div className="mt-2 text-2xl font-semibold text-foreground">{count}</div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-background">
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">{pct}% of leads</div>
          </div>
        );
      })}
    </div>
  );
}

function LeadsTable({ leads }: { leads: BackendLead[] }) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
    <table className="w-full min-w-[640px] text-sm">
      <thead>
        <tr className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <th className="px-5 py-2.5 font-medium">Customer</th>
          <th className="px-3 py-2.5 font-medium">Trip</th>
          <th className="px-3 py-2.5 font-medium">Status</th>
          <th className="px-3 py-2.5 font-medium">Agent</th>
          <th className="px-5 py-2.5 font-medium">Created</th>
        </tr>
      </thead>
      <tbody>
        {leads.map((lead) => (
          <tr key={lead.id} className="border-t border-border transition hover:bg-surface-2">
            <td className="px-5 py-3">
              <div className="flex items-center gap-3">
                <Avatar name={lead.customer_name} />
                <div>
                  <div className="font-medium text-foreground">{lead.customer_name}</div>
                  <div className="text-xs text-muted-foreground">{lead.customer_email}</div>
                </div>
              </div>
            </td>
            <td className="px-3 py-3 text-muted-foreground">
              {lead.pickup_location}
              {" -> "}
              {lead.drop_location}
            </td>
            <td className="px-3 py-3">
              <Badge tone={statusTone(lead.status)}>{statusLabel(lead.status)}</Badge>
            </td>
            <td className="px-3 py-3 text-muted-foreground">
              {lead.assigned_agent?.name ?? "Unassigned"}
            </td>
            <td className="px-5 py-3 text-muted-foreground">{formatDate(lead.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

function statusLabel(status: BackendLeadStatus) {
  return status.replace("_", " ").toLowerCase().replace(/^\w/, (char) => char.toUpperCase());
}

function statusTone(status: BackendLeadStatus): BadgeTone {
  if (status === "CONFIRMED" || status === "COMPLETED") return "success";
  if (status === "NEGOTIATING") return "warning";
  if (status === "CONTACTED") return "info";
  return "neutral";
}

function currency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
