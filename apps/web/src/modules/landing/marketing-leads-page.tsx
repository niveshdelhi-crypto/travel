import type { MarketplaceSupplier } from "@/lib/marketplace/types";
import { LandingFooter } from "./components/footer";
import { MarketingCallHeader } from "./components/marketing-call-header";
import { MobileCallStickyCta } from "./components/mobile-call-sticky-cta";
import { LandingMainSections } from "./landing-main-sections";
import { HeroSection } from "./sections/hero-section";

type MarketingLeadsLandingPageProps = {
  suppliers: MarketplaceSupplier[];
};

/**
 * Duplicate of the home landing page for paid marketing / lead campaigns.
 * No navbar links or search form — header and hero use a click-to-call CTA only.
 */
export function MarketingLeadsLandingPage({ suppliers }: MarketingLeadsLandingPageProps) {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <MarketingCallHeader />
      <main>
        <HeroSection leadMode suppliers={suppliers} />
        <LandingMainSections suppliers={suppliers} />
      </main>
      <LandingFooter />
      <MobileCallStickyCta />
    </div>
  );
}
