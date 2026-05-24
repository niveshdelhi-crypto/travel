import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { LeadsPipelineView } from "@/routes/app.leads";
import { requireAgentRoute } from "@/lib/route-guards";

export const Route = createFileRoute("/app/workspace")({
  beforeLoad: requireAgentRoute,
  component: WorkspacePage,
});

function WorkspacePage() {
  return (
    <AppShell title="My workspace">
      <LeadsPipelineView scope="my" />
    </AppShell>
  );
}
