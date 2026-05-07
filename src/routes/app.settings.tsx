import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { Panel, PanelHeader } from "@/components/app/primitives";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings — RentOps CRM" }] }),
  component: () => (
    <AppShell title="Settings">
      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <Panel><PanelHeader title="Workspace" subtitle="Organization preferences" /><div className="p-5 text-sm text-muted-foreground">Coming soon — billing, branding, integrations.</div></Panel>
        <Panel><PanelHeader title="Telephony" subtitle="Cloud phone configuration" /><div className="p-5 text-sm text-muted-foreground">Coming soon — DIDs, IVR, recording.</div></Panel>
      </div>
    </AppShell>
  ),
});
