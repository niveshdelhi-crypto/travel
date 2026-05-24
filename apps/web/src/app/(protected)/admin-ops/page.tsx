import { AdminOpsPage } from "@/modules/crm/admin-ops-page";
import { requireAuth } from "@/lib/auth/server";

export default async function AdminOpsRoute() {
  await requireAuth(["admin"]);
  return <AdminOpsPage />;
}
