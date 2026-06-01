import type { MarketplaceSupplier } from "@/lib/marketplace/types";
import { SupplierLogoMarquee } from "../components/supplier-logo-marquee";

type SuppliersSectionProps = {
  suppliers: MarketplaceSupplier[];
};

export function SuppliersSection({ suppliers }: SuppliersSectionProps) {
  return (
    <section className="bg-surface-muted py-12 md:py-16">
      <div className="container-page">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
              Trusted suppliers
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-foreground md:text-3xl">
              We compare the brands you trust
            </h2>
          </div>
          <p className="hidden max-w-sm text-sm text-muted-foreground md:block">
            One search, every major rental supplier. Side-by-side prices, real availability.
          </p>
        </div>

        <div className="mt-8">
          <SupplierLogoMarquee suppliers={suppliers} variant="section" />
        </div>
      </div>
    </section>
  );
}
