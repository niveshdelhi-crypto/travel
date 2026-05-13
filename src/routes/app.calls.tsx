import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { EmptyState, Panel } from "@/components/app/primitives";
import { Phone } from "lucide-react";

export const Route = createFileRoute("/app/calls")({
  component: CallsPage,
});

function CallsPage() {
  return (
    <AppShell title="Cloud telephony">
      <div className="p-6">
        <Panel>
          <EmptyState
            icon={Phone}
            title="Telephony data model pending"
            description="No call records are rendered because the backend does not yet expose persisted call sessions, recordings, or live telephony APIs."
          />
        </Panel>
      </div>
    </AppShell>
  );
}
