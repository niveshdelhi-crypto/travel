const suppliers = [
  "Hertz", "Avis", "Enterprise", "Budget", "Alamo",
  "Thrifty", "Europcar", "Sixt", "Dollar", "National",
];

export function Suppliers() {
  return (
    <section className="bg-surface-muted py-12 md:py-16">
      <div className="container-page">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Our suppliers</p>
            <h2 className="mt-2 font-display text-2xl md:text-3xl font-bold text-foreground">
              We compare the brands you trust
            </h2>
          </div>
          <p className="hidden md:block max-w-sm text-sm text-muted-foreground">
            One search, every major rental supplier. Side-by-side prices, real availability.
          </p>
        </div>

        <div className="relative mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max gap-4 animate-marquee">
            {[...suppliers, ...suppliers].map((s, i) => (
              <div
                key={`${s}-${i}`}
                className="flex h-20 w-44 shrink-0 items-center justify-center rounded-2xl border border-border bg-white shadow-card"
              >
                <span className="font-display text-lg font-bold tracking-tight text-navy">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
