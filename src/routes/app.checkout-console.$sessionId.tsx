import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { CheckoutConsoleDashboard } from "@/components/finance/checkout-console-dashboard";
import { requirePaymentConsoleRoute } from "@/lib/route-guards";

export const Route = createFileRoute("/app/checkout-console/$sessionId")({
  beforeLoad: requirePaymentConsoleRoute,
  component: CheckoutConsoleRoute,
});

function CheckoutConsoleRoute() {
  const { sessionId } = Route.useParams();
  return (
    <AppShell title="Checkout Console">
      <CheckoutConsoleDashboard sessionId={sessionId} />
    </AppShell>
  );
}
