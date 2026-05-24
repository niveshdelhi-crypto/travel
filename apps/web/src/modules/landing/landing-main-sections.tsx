import { AppCtaSection } from "./sections/app-cta";
import { DestinationsSection } from "./sections/destinations";
import { FaqSection } from "./sections/faq-section";
import { HowItWorksSection } from "./sections/how-it-works";
import { SuppliersSection } from "./sections/suppliers-section";
import { TestimonialsSection } from "./sections/testimonials";
import { TrustStrip } from "./sections/trust-strip";
import { VehicleCategoriesSection } from "./sections/vehicle-categories";
import { WhyUsSection } from "./sections/why-us";

/** Shared body sections below the hero on home and marketing lead pages. */
export function LandingMainSections() {
  return (
    <>
      <TrustStrip />
      <SuppliersSection />
      <WhyUsSection />
      <DestinationsSection />
      <VehicleCategoriesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <AppCtaSection />
      <FaqSection />
    </>
  );
}
