import type { Metadata } from "next";
import { LegalDoc } from "@/modules/landing/components/legal-doc";

export const metadata: Metadata = {
  title: "Privacy Policy | MarkleTravelBooking",
  description: "How MarkleTravelBooking collects, uses, and protects your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDoc
      title="Privacy Policy"
      updated="January 2026"
      sections={[
        {
          id: "data",
          title: "Data we collect",
          body: "Booking details, contact information, payment data (tokenized), and basic analytics on how you use the site.",
        },
        {
          id: "use",
          title: "How we use it",
          body: "To process bookings, communicate with you, and improve the platform. We never sell personal data.",
        },
        {
          id: "share",
          title: "Sharing with suppliers",
          body: "We share only the data strictly necessary to fulfil your reservation with the supplier you choose.",
        },
        {
          id: "rights",
          title: "Your rights",
          body: "Access, rectification, erasure, portability, and the right to lodge a complaint with your supervisory authority.",
        },
        {
          id: "contact",
          title: "Contact",
          body: "privacy@markletravelbooking.com",
        },
      ]}
    />
  );
}
