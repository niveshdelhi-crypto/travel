"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  CircleDollarSign,
  LayoutGrid,
  Phone,
  Users,
} from "lucide-react";
import {
  useLeadMetricsQuery,
  useLeadRealtimeInvalidation,
  useLeadsQuery,
} from "@/hooks/api/use-leads-api";
import type { AuthUser } from "@/lib/auth/types";
import type { PaginatedBookings, PaginatedPayments } from "@/lib/bookings/types";
import type { LeadMetrics, LeadStatus, PaginatedLeads } from "@/lib/leads/types";

const pipelineStatuses: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "NEGOTIATING",
  "CONFIRMED",
  "COMPLETED",
];

const statusLabel: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  NEGOTIATING: "Negotiating",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
};

type DeskLink = {
  href: Route;
  title: string;
  description: string;
  icon: typeof LayoutGrid;
};

export function OperationsDashboard({
  user,
  isAdmin,
  initialMetrics,
  initialLeads,
  initialBookings,
  initialPayments,
}: {
  user: AuthUser;
  isAdmin: boolean;
  initialMetrics: LeadMetrics;
  initialLeads: PaginatedLeads;
  initialBookings: PaginatedBookings | null;
  initialPayments: PaginatedPayments | null;
}) {
  const metricsQuery = useLeadMetricsQuery(initialMetrics);
  const leadsQuery = useLeadsQuery({ page: 1, pageSize: 8, status: "ALL" }, initialLeads);

  useLeadRealtimeInvalidation(isAdmin);

  const metrics = metricsQuery.data ?? initialMetrics;
  const leads = (leadsQuery.data ?? initialLeads).data;
  const openLeads = pipelineStatuses
    .filter((s) => s !== "COMPLETED")
    .reduce((sum, key) => sum + (metrics.statusCounts[key] ?? 0), 0);

  const desks: DeskLink[] = [
    {
      href: "/leads",
      title: "Lead pipeline",
      description: "Kanban nurturing, stage advances, follow-ups, and close-as-booked.",
      icon: LayoutGrid,
    },
    {
      href: "/sales",
      title: isAdmin ? "Sales desk" : "My desk",
      description: "Table workspace with notes, call logging, and booking value.",
      icon: LayoutGrid,
    },
    ...(isAdmin
      ? [
          {
            href: "/admin" as Route,
            title: "Admin desk",
            description: "Full queue, assignment load, and team-wide visibility.",
            icon: Users,
          },
        ]
      : []),
    {
      href: "/bookings",
      title: "Bookings",
      description: "Recorded corridor wins from closed leads.",
      icon: LayoutGrid,
    },
    {
      href: "/payments",
      title: "Payments",
      description: "Recognized revenue entries tied to bookings.",
      icon: CircleDollarSign,
    },
    {
      href: "/calls",
      title: "Calling workspace",
      description: "Outbound dialer with live call state and lead context.",
      icon: Phone,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f5f7fa] px-5 py-5 text-[#172033]">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#d7dde8] pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#637083]">
              Operations
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-[#637083]">
              Welcome back, {user.name}. Real-time CRM overview
              {metricsQuery.isFetching ? " · updating" : ""}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void metricsQuery.refetch();
              void leadsQuery.refetch();
            }}
            className="h-9 rounded-md border border-[#cbd3df] bg-white px-3 text-sm font-medium shadow-sm"
          >
            Refresh
          </button>
        </header>

        <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <Metric label="Total leads" value={metrics.totalLeads} />
          <Metric label="Open pipeline" value={openLeads} />
          <Metric label="Bookings" value={metrics.bookings} />
          <Metric label="Conversion" value={`${metrics.conversion}%`} />
          <Metric label="Pipeline revenue" value={currency(metrics.revenue)} />
          <Metric label="New leads" value={metrics.statusCounts.NEW} />
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="border border-[#d7dde8] bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#637083]">
              Pipeline breakdown
            </h2>
            <ul className="mt-4 space-y-3">
              {pipelineStatuses.map((status) => (
                <PipelineRow
                  key={status}
                  label={statusLabel[status]}
                  count={metrics.statusCounts[status] ?? 0}
                  total={Math.max(metrics.totalLeads, 1)}
                />
              ))}
            </ul>
          </div>

          <div className="grid gap-3">
            {desks.map((desk) => (
              <DeskCard key={desk.href} {...desk} />
            ))}
          </div>
        </section>

        {isAdmin && metrics.activeAgents.length > 0 ? (
          <section className="mt-4 border border-[#d7dde8] bg-white px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold uppercase text-[#637083]">
                Agent assignment load
              </span>
              {metrics.activeAgents.map((agent) => (
                <span key={agent.id} className="text-sm text-[#2d3a4f]">
                  {agent.name}: <strong>{agent.current_lead_count}</strong>
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-4 grid gap-4 xl:grid-cols-2">
          <div className="border border-[#d7dde8] bg-white">
            <div className="flex items-center justify-between border-b border-[#d7dde8] px-4 py-3">
              <h2 className="font-semibold">Recent leads</h2>
              <div className="flex gap-3">
                <Link
                  href="/leads"
                  className="inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:text-sky-800"
                >
                  Pipeline
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={(isAdmin ? "/admin" : "/sales") as Route}
                  className="inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:text-sky-800"
                >
                  Desk
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            {leads.length === 0 ? (
              <EmptyState message="No leads in the queue yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="bg-[#f8fafc] text-xs uppercase text-[#637083]">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Customer</th>
                      <th className="px-4 py-2 font-semibold">Route</th>
                      <th className="px-4 py-2 font-semibold">Status</th>
                      <th className="px-4 py-2 font-semibold">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} className="border-t border-[#eef2f7]">
                        <td className="px-4 py-2.5">
                          <p className="font-medium">{lead.customer_name}</p>
                          <p className="text-xs text-[#637083]">{lead.customer_phone}</p>
                        </td>
                        <td className="px-4 py-2.5 text-[#36445a]">
                          {lead.pickup_location} → {lead.drop_location}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusPill status={lead.status} />
                        </td>
                        <td className="px-4 py-2.5">
                          {lead.booking_value != null
                            ? currency(Number(lead.booking_value))
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <RevenuePanel
              title="Recent bookings"
              icon={LayoutGrid}
              emptyMessage="No closed bookings recorded yet."
              items={
                initialBookings?.data.map((booking) => ({
                  id: booking.id,
                  primary: booking.lead.customer_name,
                  secondary: booking.partner_name ?? booking.confirmation_reference ?? "—",
                  amount: currency(Number(booking.gross_revenue)),
                  when: formatShortDate(booking.created_at),
                })) ?? []
              }
              total={initialBookings?.total ?? 0}
            />
            <RevenuePanel
              title="Recent payments"
              icon={CircleDollarSign}
              emptyMessage="No payment entries yet."
              items={
                initialPayments?.data.map((payment) => ({
                  id: payment.id,
                  primary: payment.booking.lead.customer_name,
                  secondary: payment.kind.replaceAll("_", " "),
                  amount: currency(Number(payment.amount)),
                  when: formatShortDate(payment.created_at),
                })) ?? []
              }
              total={initialPayments?.total ?? 0}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function DeskCard({
  href,
  title,
  description,
  icon: Icon,
}: DeskLink) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 border border-[#d7dde8] bg-white p-4 transition hover:border-[#b8c4d6] hover:shadow-sm"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#172033] text-white">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="font-semibold">{title}</span>
          <ArrowRight className="h-4 w-4 text-[#637083] transition group-hover:translate-x-0.5 group-hover:text-[#172033]" />
        </span>
        <span className="mt-1 block text-sm text-[#637083]">{description}</span>
      </span>
    </Link>
  );
}

function PipelineRow({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const width = Math.round((count / total) * 100);

  return (
    <li>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold tabular-nums">{count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#eef2f7]">
        <div
          className="h-full rounded-full bg-[#172033] transition-all"
          style={{ width: `${width}%` }}
        />
      </div>
    </li>
  );
}

function RevenuePanel({
  title,
  icon: Icon,
  emptyMessage,
  items,
  total,
}: {
  title: string;
  icon: typeof LayoutGrid;
  emptyMessage: string;
  items: Array<{
    id: string;
    primary: string;
    secondary: string;
    amount: string;
    when: string;
  }>;
  total: number;
}) {
  return (
    <div className="border border-[#d7dde8] bg-white">
      <div className="flex items-center justify-between border-b border-[#d7dde8] px-4 py-3">
        <h2 className="inline-flex items-center gap-2 font-semibold">
          <Icon className="h-4 w-4 text-[#637083]" />
          {title}
        </h2>
        <span className="text-xs font-semibold uppercase text-[#637083]">{total} total</span>
      </div>
      {items.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <ul className="divide-y divide-[#eef2f7]">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{item.primary}</p>
                <p className="truncate text-xs text-[#637083]">{item.secondary}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold tabular-nums">{item.amount}</p>
                <p className="text-xs text-[#637083]">{item.when}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-[#d7dde8] bg-white p-3">
      <p className="text-xs font-semibold uppercase text-[#637083]">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: LeadStatus }) {
  return (
    <span className="inline-flex rounded-md bg-[#e9eef5] px-2 py-1 text-xs font-semibold text-[#36445a]">
      {statusLabel[status]}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="px-4 py-8 text-center text-sm text-[#637083]">{message}</p>;
}

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
