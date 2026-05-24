import { createFileRoute } from "@tanstack/react-router";
import { LegalDoc } from "@/components/site/LegalDoc";

export const Route = createFileRoute("/legal/rental-conditions")({
  head: () => ({ meta: [{ title: "Rental Conditions — Book my Carz" }] }),
  component: () => (
    <LegalDoc
      title="Rental Conditions"
      updated="January 2026"
      sections={[
        { id: "driver", title: "Driver requirements", body: "Minimum age usually 21, with at least 1 year of license. Young / senior driver fees may apply." },
        { id: "documents", title: "Required documents", body: "Valid driving license, passport or national ID, and the credit card used at booking." },
        { id: "deposit", title: "Security deposit", body: "Suppliers will pre-authorize a deposit on your credit card at pickup. Amount depends on vehicle category." },
        { id: "fuel", title: "Fuel policy", body: "Most rentals follow Full-to-Full: collect the car with a full tank, return it the same way." },
        { id: "insurance", title: "Insurance", body: "Basic third-party cover is included. Add Super Cover at checkout for zero-excess peace of mind." },
        { id: "mileage", title: "Mileage", body: "Most rentals include unlimited mileage. Restrictions are clearly displayed before you book." },
      ]}
    />
  ),
});
