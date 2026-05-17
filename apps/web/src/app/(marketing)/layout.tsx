import { LandingFooter } from "@/modules/landing/components/footer";
import { LandingNavbar } from "@/modules/landing/components/navbar";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      <main className="container-page py-10 md:py-14">{children}</main>
      <LandingFooter />
    </div>
  );
}
