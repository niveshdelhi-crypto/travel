import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import {
  Badge,
  Panel,
  PanelHeader,
  StatCard,
  Avatar,
  ProgressBar,
} from "@/components/app/primitives";
import {
  CalendarCheck,
  MoreHorizontal,
  Search,
  Filter,
  Plus,
  Download,
  Car,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { BookingStatus } from "@/types";

export const Route = createFileRoute("/app/bookings")({
    component: BookingsPage,
});

interface BookingRow {
  id: string;
  customer: string;
  vehicle: string;
  provider: string;
  pickup: string;
  dropoff: string;
  dates: string;
  duration: string;
  total: string;
  status: BookingStatus;
  agent: string;
}

const bookings: BookingRow[] = [
  { id: "BK-9821", customer: "Sarah Chen",    vehicle: "Range Rover Sport", provider: "Hertz",      pickup: "JFK Airport, NY",   dropoff: "Manhattan, NY",       dates: "May 12 → 18", duration: "6 days", total: "$1,240", status: "confirmed",  agent: "AK" },
  { id: "BK-9820", customer: "Marcus Reid",   vehicle: "BMW 5 Series",      provider: "Sixt",       pickup: "LAX Airport, CA",   dropoff: "San Diego, CA",       dates: "May 14 → 18", duration: "4 days", total: "$890",   status: "pending",    agent: "JM" },
  { id: "BK-9819", customer: "Priya Shah",    vehicle: "Tesla Model Y",     provider: "Avis",       pickup: "YYZ Airport, ON",   dropoff: "Niagara Falls, ON",   dates: "May 16 → 19", duration: "3 days", total: "$540",   status: "confirmed",  agent: "AK" },
  { id: "BK-9818", customer: "Diego Alvarez", vehicle: "Audi A6",           provider: "Enterprise", pickup: "ORD Airport, IL",   dropoff: "Milwaukee, WI",       dates: "May 18 → 23", duration: "5 days", total: "$1,120", status: "pending",    agent: "RP" },
  { id: "BK-9817", customer: "Olivia Bennett",vehicle: "Toyota GR86",       provider: "Budget",     pickup: "MIA Airport, FL",   dropoff: "Key West, FL",        dates: "May 19 → 23", duration: "4 days", total: "$980",   status: "confirmed",  agent: "JM" },
  { id: "BK-9816", customer: "Emily Watson",  vehicle: "Mercedes GLE",      provider: "Hertz",      pickup: "SEA Airport, WA",   dropoff: "Vancouver, BC",       dates: "May 20 → 27", duration: "7 days", total: "$1,680", status: "active",     agent: "JM" },
  { id: "BK-9815", customer: "Hiroshi Tanaka",vehicle: "BMW X5",            provider: "Enterprise", pickup: "BOS Airport, MA",   dropoff: "Cape Cod, MA",        dates: "May 11 → 17", duration: "6 days", total: "$1,420", status: "completed",  agent: "AK" },
  { id: "BK-9814", customer: "Daniel Park",   vehicle: "Chevrolet Malibu",  provider: "Alamo",      pickup: "DFW Airport, TX",   dropoff: "Austin, TX",          dates: "May 04 → 09", duration: "5 days", total: "$760",   status: "completed",  agent: "RP" },
];

const STATUS_CONFIG: Record<BookingStatus, { tone: "success" | "warning" | "info" | "primary" | "neutral" | "danger"; label: string }> = {
  confirmed:  { tone: "success", label: "Confirmed" },
  pending:    { tone: "warning", label: "Pending" },
  active:     { tone: "info",    label: "Active" },
  completed:  { tone: "primary", label: "Completed" },
  cancelled:  { tone: "danger",  label: "Cancelled" },
  refunded:   { tone: "neutral", label: "Refunded" },
};

function BookingsPage() {
  const confirmed  = bookings.filter((b) => b.status === "confirmed").length;
  const pending    = bookings.filter((b) => b.status === "pending").length;
  const active     = bookings.filter((b) => b.status === "active").length;
  const total      = bookings.reduce((s, b) => s + parseInt(b.total.replace(/[$,]/g, "")), 0);

  return (
    <AppShell title="Bookings">
      <div className="space-y-6 p-6">

        {/* KPI row */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total bookings"   value={String(bookings.length)} delta="+18 this week"  icon={CalendarCheck} spark={[60,65,70,72,74,78,80,82,84,88]} />
          <StatCard label="Confirmed"        value={String(confirmed)}       delta="Active pipeline" icon={CheckCircle2}  spark={[20,22,24,26,26,28,30,30,32,32]} />
          <StatCard label="Pending approval" value={String(pending)}         delta="Needs action"   icon={AlertCircle}   spark={[5,6,7,8,7,8,6,7,6,2]} trend="down" />
          <StatCard label="Total value"      value={`$${(total / 1000).toFixed(1)}k`} delta="+8.2%" icon={Car}           spark={[40,48,50,55,58,62,66,70,74,82]} />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search bookings…"
              className="h-8 w-64 rounded-md border border-border bg-surface pl-8 pr-3 text-sm focus:outline-none"
            />
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs hover:bg-surface-2">
            <Filter className="h-3.5 w-3.5" /> All statuses
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs hover:bg-surface-2">
            All providers
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs hover:bg-surface-2">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> New booking
            </button>
          </div>
        </div>

        {/* Bookings table */}
        <Panel>
          <PanelHeader title="All bookings" subtitle="Across providers and locations" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-2.5">Booking</th>
                  <th className="px-3 py-2.5">Customer</th>
                  <th className="px-3 py-2.5">Vehicle</th>
                  <th className="px-3 py-2.5">Route</th>
                  <th className="px-3 py-2.5">Dates</th>
                  <th className="px-3 py-2.5">Total</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Agent</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const cfg = STATUS_CONFIG[b.status];
                  return (
                    <tr key={b.id} className="border-t border-border transition hover:bg-surface-2">
                      <td className="px-5 py-3">
                        <div className="font-mono text-xs font-medium text-foreground">{b.id}</div>
                        <div className="text-[11px] text-muted-foreground">{b.provider}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={b.customer} />
                          <span className="font-medium text-foreground">{b.customer}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-foreground/90">
                          <Car className="h-3 w-3 text-muted-foreground shrink-0" />
                          {b.vehicle}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-2.5 w-2.5" />
                            <span className="truncate max-w-[120px]">{b.pickup}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-2.5 w-2.5 text-primary" />
                            <span className="truncate max-w-[120px]">{b.dropoff}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs text-foreground">{b.dates}</div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-2.5 w-2.5" />
                          {b.duration}
                        </div>
                      </td>
                      <td className="px-3 py-3 font-semibold text-foreground">{b.total}</td>
                      <td className="px-3 py-3">
                        <Badge tone={cfg.tone}>{cfg.label}</Badge>
                      </td>
                      <td className="px-3 py-3">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-surface-2 text-[10px] font-semibold text-foreground">
                          {b.agent}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button className="text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">1–{bookings.length}</span> of{" "}
              <span className="font-medium text-foreground">142</span> bookings
            </p>
            <div className="flex items-center gap-1">
              <button className="grid h-7 w-7 place-items-center rounded-md border border-border bg-surface text-muted-foreground hover:bg-surface-2 disabled:opacity-40" disabled>
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  className={`grid h-7 w-7 place-items-center rounded-md border text-xs font-medium transition ${
                    p === 1
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface text-muted-foreground hover:bg-surface-2"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button className="grid h-7 w-7 place-items-center rounded-md border border-border bg-surface text-muted-foreground hover:bg-surface-2">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
