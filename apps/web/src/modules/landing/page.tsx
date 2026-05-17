import { LandingFooter } from "./components/footer";
import { LandingNavbar } from "./components/navbar";
import { MobileStickyCta } from "./components/mobile-sticky-cta";
import { AppCtaSection } from "./sections/app-cta";
import { DestinationsSection } from "./sections/destinations";
import { FaqSection } from "./sections/faq-section";
import { HeroSection } from "./sections/hero-section";
import { HowItWorksSection } from "./sections/how-it-works";
import { SuppliersSection } from "./sections/suppliers-section";
import { TestimonialsSection } from "./sections/testimonials";
import { TrustStrip } from "./sections/trust-strip";
import { VehicleCategoriesSection } from "./sections/vehicle-categories";
import { WhyUsSection } from "./sections/why-us";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <LandingNavbar />
      <main>
        <HeroSection />
        <TrustStrip />
        <SuppliersSection />
        <WhyUsSection />
        <DestinationsSection />
        <VehicleCategoriesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <AppCtaSection />
        <FaqSection />
      </main>
      <LandingFooter />
      <MobileStickyCta />
    </div>
  );
}
