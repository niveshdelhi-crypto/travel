import type { Metadata } from "next";
import { LegalDoc } from "@/modules/landing/components/legal-doc";

export const metadata: Metadata = {
  title: "Terms & Conditions | MarkleTravelBooking",
  description:
    "MarkleTravelBooking terms and conditions for using our car rental comparison platform.",
};

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms & Conditions"
      updated="January 2026"
      sections={[
        {
          id: "service",
          title: "Our service",
          body: "MarkleTravelBooking is a comparison and booking facilitation platform. The rental contract is between you and the supplier.",
        },
        {
          id: "bookings",
          title: "Bookings",
          body: "Confirmed bookings are subject to supplier terms, availability, and local regulations.",
        },
        {
          id: "pricing",
          title: "Pricing",
          body: "Displayed prices include known taxes and fees where indicated. Supplier charges at pickup may still apply.",
        },
        {
          id: "liability",
          title: "Liability",
          body: "MarkleTravelBooking is not liable for supplier acts or omissions beyond applicable consumer protection law.",
        },
        {
          id: "law",
          title: "Governing law",
          body: "These terms are governed by the laws of the United Arab Emirates unless mandatory local law applies.",
        },
        {
          id: "contact",
          title: "Contact",
          body: "legal@markletravelbooking.com",
        },
      ]}
    />
  );
}
