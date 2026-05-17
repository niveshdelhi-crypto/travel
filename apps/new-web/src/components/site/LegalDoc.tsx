import { ChevronDown } from "lucide-react";

export function LegalDoc({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: { id: string; title: string; body: string }[];
}) {
  return (
    <div>
      <header className="border-b border-border pb-6">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>
      </header>

      <nav aria-label="Table of contents" className="mt-6 rounded-2xl border border-border bg-surface-muted p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">On this page</h2>
        <ol className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
          {sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-accent hover:underline">
                {i + 1}. {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-8 space-y-3">
        {sections.map((s, i) => (
          <details key={s.id} id={s.id} open={i < 2} className="group rounded-2xl border border-border bg-white p-5">
            <summary className="cursor-pointer list-none flex items-center justify-between font-display text-lg font-semibold text-foreground">
              <span>{i + 1}. {s.title}</span>
              <ChevronDown className="size-5 transition-transform group-open:rotate-180 text-muted-foreground" />
            </summary>
            <div className="mt-3 text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
              {s.body}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
