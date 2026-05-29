import { createFileRoute } from "@tanstack/react-router";
import { requirePaymentConsoleRoute } from "@/lib/route-guards";
import { AppShell } from "@/components/app/app-shell";
import { PaymentAdminDashboard } from "@/components/payments/payment-admin-dashboard";

export const Route = createFileRoute("/app/payments")({
  beforeLoad: requirePaymentConsoleRoute,
  component: PaymentsConsoleRoute,
});

function PaymentsConsoleRoute() {
  return (
    <AppShell title="Payments">
      <PaymentAdminDashboard />
    </AppShell>
  );
}
