import { TeamPage } from "@/modules/crm/team-page";
import { requireAuth } from "@/lib/auth/server";

export default async function TeamRoute() {
  await requireAuth();
  return <TeamPage />;
}
