import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { FinanceDashboard } from "@/components/finance/finance-dashboard";
import { requirePaymentConsoleRoute } from "@/lib/route-guards";

export const Route = createFileRoute("/app/finance")({
  beforeLoad: requirePaymentConsoleRoute,
  component: FinanceRoute,
});

function FinanceRoute() {
  return (
    <AppShell title="Finance">
      <FinanceDashboard />
    </AppShell>
  );
}
