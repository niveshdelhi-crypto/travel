import { GitCompareArrows, KeyRound, Search } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Search",
    desc: "Tell us where and when. We instantly scan 800+ rental suppliers.",
  },
  {
    icon: GitCompareArrows,
    title: "Compare",
    desc: "Side-by-side prices, inclusions, and ratings. Filter to your perfect match.",
  },
  {
    icon: KeyRound,
    title: "Book",
    desc: "Confirm in seconds with free cancellation. Pick up your keys at arrival.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-navy py-20 text-navy-foreground md:py-28">
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent">
            How it works
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Three steps to the open road
          </h2>
        </div>

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="relative rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur"
            >
              <span className="absolute -top-4 left-7 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary font-display text-sm font-bold text-white shadow-cta">
                {i + 1}
              </span>
              <div className="flex size-12 items-center justify-center rounded-xl bg-white/10 text-white">
                <s.icon className="size-6" />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/75">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
