import { LeadDashboard } from "@/components/leads/lead-dashboard";
import { requireAuth } from "@/lib/auth/server";
import { listServerLeads } from "@/lib/leads/server";

export default async function AdminPage() {
  await requireAuth(["admin"]);
  const leads = await listServerLeads();

  return <LeadDashboard mode="admin" initialLeads={leads} />;
}
