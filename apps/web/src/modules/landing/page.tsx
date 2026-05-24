import { LandingFooter } from "./components/footer";
import { LandingNavbar } from "./components/navbar";
import { MobileStickyCta } from "./components/mobile-sticky-cta";
import { LandingMainSections } from "./landing-main-sections";
import { HeroSection } from "./sections/hero-section";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <LandingNavbar />
      <main>
        <HeroSection />
        <LandingMainSections />
      </main>
      <LandingFooter />
      <MobileStickyCta />
    </div>
  );
}
