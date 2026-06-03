import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/site/Hero";
import { TrustStrip } from "@/components/site/TrustStrip";
import { Suppliers } from "@/components/site/Suppliers";
import { WhyUs } from "@/components/site/WhyUs";
import { Destinations } from "@/components/site/Destinations";
import { VehicleCategories } from "@/components/site/VehicleCategories";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Testimonials } from "@/components/site/Testimonials";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MarkleTravelBooking — Compare car rentals worldwide" },
      { name: "description", content: "Compare 800+ car rental suppliers in 190+ countries. Best price, free cancellation, no hidden fees. Book your perfect rental in seconds." },
      { property: "og:title", content: "MarkleTravelBooking — Compare car rentals worldwide" },
      { property: "og:description", content: "Compare 800+ rental suppliers in 190+ countries. Best price, free cancellation, no hidden fees." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <TrustStrip />
        <Suppliers />
        <WhyUs />
        <Destinations />
        <VehicleCategories />
        <HowItWorks />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
