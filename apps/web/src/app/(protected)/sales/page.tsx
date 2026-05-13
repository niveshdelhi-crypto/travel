import { LeadDashboard } from "@/components/leads/lead-dashboard";
import { requireAuth } from "@/lib/auth/server";
import { listServerLeads } from "@/lib/leads/server";

export default async function SalesPage() {
  await requireAuth(["admin", "sales_agent"]);
  const leads = await listServerLeads();

  return <LeadDashboard mode="sales" initialLeads={leads} />;
}
