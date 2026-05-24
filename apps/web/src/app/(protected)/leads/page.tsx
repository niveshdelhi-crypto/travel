import { LeadsPipeline } from "@/modules/crm/leads-pipeline";
import { requireAuth } from "@/lib/auth/server";
import { listServerAdminLeads, listServerMyLeads } from "@/lib/leads/server";

export default async function LeadsPage() {
  const user = await requireAuth();
  const scope = user.role === "admin" ? "admin" : "my";
  const leads =
    scope === "admin"
      ? await listServerAdminLeads({ page: 1, pageSize: 100 })
      : await listServerMyLeads({ page: 1, pageSize: 100 });

  return <LeadsPipeline initialLeads={leads} scope={scope} />;
}
