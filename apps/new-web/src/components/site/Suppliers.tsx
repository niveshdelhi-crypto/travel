const suppliers = [
  "Hertz", "Avis", "Enterprise", "Budget", "Alamo",
  "Thrifty", "Europcar", "Sixt", "Dollar", "National",
];

function buildMarqueeLoop(items: string[], minTiles = 10): string[] {
  const expanded: string[] = [];
  while (expanded.length < minTiles) {
    expanded.push(...items);
  }
  return expanded;
}

function BrandTile({ name }: { name: string; keyPrefix: string; index: number }) {
  return (
    <div className="flex h-20 w-44 shrink-0 items-center justify-center rounded-2xl border border-border bg-white shadow-card">
      <span className="font-display text-lg font-bold tracking-tight text-navy">{name}</span>
    </div>
  );
}

export function Suppliers() {
  const marqueeItems = buildMarqueeLoop(suppliers, 12);

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
          <div className="flex w-max flex-nowrap animate-marquee motion-reduce:animate-none">
            <div className="flex shrink-0 gap-4">
              {marqueeItems.map((s, i) => (
                <BrandTile key={`a-${s}-${i}`} name={s} keyPrefix="a" index={i} />
              ))}
            </div>
            <div className="flex shrink-0 gap-4" aria-hidden>
              {marqueeItems.map((s, i) => (
                <BrandTile key={`b-${s}-${i}`} name={s} keyPrefix="b" index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
