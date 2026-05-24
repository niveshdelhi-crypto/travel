import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { CallingWorkspace } from "@/modules/calls/CallingWorkspace";

export const Route = createFileRoute("/app/calls")({
  component: CallsPage,
});

function CallsPage() {
  return (
    <AppShell title="Cloud telephony">
      <CallingWorkspace />
    </AppShell>
  );
}
