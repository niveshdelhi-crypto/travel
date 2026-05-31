import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { PaymentTestingConsole } from "@/components/payments/payment-testing-console";
import { requireAdminRoute } from "@/lib/route-guards";

export const Route = createFileRoute("/app/payment-testing")({
  beforeLoad: requireAdminRoute,
  component: PaymentTestingRoute,
});

function PaymentTestingRoute() {
  return (
    <AppShell title="Payment Testing">
      <PaymentTestingConsole />
    </AppShell>
  );
}
