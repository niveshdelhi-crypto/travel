import type { Metadata } from "next";
import { LegalDoc } from "@/modules/landing/components/legal-doc";

export const metadata: Metadata = {
  title: "Rental Conditions | MarkleTravelBooking",
  description: "Standard rental conditions and requirements for MarkleTravelBooking bookings.",
};

export default function RentalConditionsPage() {
  return (
    <LegalDoc
      title="Rental Conditions"
      updated="January 2026"
      sections={[
        {
          id: "license",
          title: "Driver's license",
          body: "A valid license held for at least one year is required. International permits may be needed outside your home country.",
        },
        {
          id: "age",
          title: "Minimum age",
          body: "Most suppliers require drivers to be 21–25+. Young driver surcharges may apply for ages under 25.",
        },
        {
          id: "deposit",
          title: "Security deposit",
          body: "A hold on your credit card is standard. Debit cards may not be accepted for deposits.",
        },
        {
          id: "fuel",
          title: "Fuel policy",
          body: "Full-to-full is most common. Return with the same fuel level to avoid refuelling charges.",
        },
        {
          id: "insurance",
          title: "Insurance",
          body: "Basic cover is included; excess reduction and personal accident cover are optional add-ons.",
        },
        {
          id: "cross-border",
          title: "Cross-border travel",
          body: "Crossing borders may require prior approval and additional documentation from the supplier.",
        },
      ]}
    />
  );
}
