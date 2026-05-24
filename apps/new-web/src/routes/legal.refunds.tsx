import { createFileRoute } from "@tanstack/react-router";
import { LegalDoc } from "@/components/site/LegalDoc";

export const Route = createFileRoute("/legal/refunds")({
  head: () => ({ meta: [{ title: "Refund Policy — Book my Carz" }] }),
  component: () => (
    <LegalDoc
      title="Refund Policy"
      updated="January 2026"
      sections={[
        { id: "free", title: "Free cancellation", body: "Rentals marked as free cancellation can be cancelled at no cost up to 48 hours before pickup. Refunds are processed within 7 business days." },
        { id: "non", title: "Non-refundable rates", body: "Lower-priced non-refundable rates cannot be refunded once booked, except where required by law." },
        { id: "noshow", title: "No-shows", body: "If you fail to collect the vehicle without prior cancellation, no refund is due." },
      ]}
    />
  ),
});
