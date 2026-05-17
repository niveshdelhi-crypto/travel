import { SUPPLIERS } from "../lib/constants";

export function SuppliersSection() {
  const marquee = [...SUPPLIERS, ...SUPPLIERS];

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

        <div className="relative mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max gap-4 animate-marquee">
            {marquee.map((name, i) => (
              <div
                key={`${name}-${i}`}
                className="supplier-logo flex h-20 w-44 shrink-0 items-center justify-center rounded-2xl border border-border bg-white shadow-card"
              >
                <span className="font-display text-lg font-bold tracking-tight text-navy">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
