import { CallingWorkspace } from "@/modules/calls/components/CallingWorkspace";
import { requireAuth } from "@/lib/auth/server";
import { listServerLeads } from "@/lib/leads/server";

export default async function CallsPage() {
  await requireAuth(["admin", "sales_agent"]);
  const leads = await listServerLeads({ page: 1, pageSize: 50 });

  return <CallingWorkspace initialLeads={leads} />;
}
