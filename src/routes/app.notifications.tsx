import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { EmptyState, Panel } from "@/components/app/primitives";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/app/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <AppShell title="Notifications">
      <div className="p-6">
        <Panel>
          <EmptyState
            icon={Bell}
            title="Notification persistence pending"
            description="Realtime notification events are emitted by the backend, but there is no notification table or list API yet."
          />
        </Panel>
      </div>
    </AppShell>
  );
}
