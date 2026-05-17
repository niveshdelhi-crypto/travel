import { createFileRoute } from "@tanstack/react-router";
import { LegalDoc } from "@/components/site/LegalDoc";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({ meta: [{ title: "Terms & Conditions — FleetNexus" }, { name: "description", content: "FleetNexus terms of service." }] }),
  component: () => (
    <LegalDoc
      title="Terms & Conditions"
      updated="January 2026"
      sections={[
        { id: "intro", title: "Introduction", body: "These terms govern your use of FleetNexus, an online marketplace that compares car rental offers from third-party suppliers worldwide. By using the platform you agree to be bound by these terms." },
        { id: "service", title: "Our service", body: "FleetNexus is an intermediary. The rental contract is concluded directly between you and the supplier. We are not a party to that contract." },
        { id: "booking", title: "Booking and payment", body: "All prices are shown in your selected currency and include taxes unless stated otherwise. Payment is processed securely. A booking voucher is sent by email upon confirmation." },
        { id: "changes", title: "Changes and cancellations", body: "Cancellation rules depend on the supplier and tariff selected at checkout. Free-cancellation rentals can be cancelled up to 48 hours before pickup for a full refund." },
        { id: "liability", title: "Liability", body: "FleetNexus is not liable for issues arising from the rental itself (vehicle condition, damages, delays). Any complaint must be raised first with the supplier." },
        { id: "law", title: "Governing law", body: "These terms are governed by the laws of the United Arab Emirates. Any dispute will be resolved before the competent courts." },
      ]}
    />
  ),
});
