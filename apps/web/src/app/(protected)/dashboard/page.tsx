import { OperationsDashboard } from "@/components/crm/operations-dashboard";
import { requireAuth } from "@/lib/auth/server";
import { listServerBookings, listServerPayments } from "@/lib/bookings/server";
import { getServerLeadMetrics, listServerLeads } from "@/lib/leads/server";

export default async function DashboardPage() {
  const user = await requireAuth();
  const isAdmin = user.role === "admin";

  const [metrics, leads, bookings, payments] = await Promise.all([
    getServerLeadMetrics(),
    listServerLeads({ page: 1, pageSize: 8 }),
    listServerBookings(1, 5).catch(() => null),
    listServerPayments(1, 5).catch(() => null),
  ]);

  return (
    <OperationsDashboard
      user={user}
      isAdmin={isAdmin}
      initialMetrics={metrics}
      initialLeads={leads}
      initialBookings={bookings}
      initialPayments={payments}
    />
  );
}
