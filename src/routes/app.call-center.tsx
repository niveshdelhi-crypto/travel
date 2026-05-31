import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { CallCenterDashboard } from "@/components/call-center/call-center-dashboard";

export const Route = createFileRoute("/app/call-center")({
  component: CallCenterPage,
});

function CallCenterPage() {
  return (
    <AppShell title="Call center">
      <CallCenterDashboard />
    </AppShell>
  );
}
