import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { BookingOperationsDashboard } from "@/components/booking-operations/booking-operations-dashboard";
import { requireBookingOperationsRoute } from "@/lib/route-guards";

export const Route = createFileRoute("/app/booking-operations")({
  beforeLoad: requireBookingOperationsRoute,
  component: BookingOperationsRoute,
});

function BookingOperationsRoute() {
  return (
    <AppShell title="Booking Operations">
      <BookingOperationsDashboard />
    </AppShell>
  );
}
