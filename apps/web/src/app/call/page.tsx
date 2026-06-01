import type { Metadata } from "next";
import { getServerMarketplaceSuppliers } from "@/lib/marketplace/server";
import { MarketingLeadsLandingPage } from "@/modules/landing/marketing-leads-page";

export const metadata: Metadata = {
  title: "Book my Carz | Call to Book Your Rental",
  description:
    "Compare 800+ car rental suppliers. Call our advisors for the best price, free cancellation, and 24/7 support.",
  robots: { index: true, follow: true },
};

export default async function MarketingCallLandingPage() {
  const suppliers = await getServerMarketplaceSuppliers();
  return <MarketingLeadsLandingPage suppliers={suppliers} />;
}
