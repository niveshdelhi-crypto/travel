import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { MarketingChrome } from "@/components/marketing/marketing-chrome";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { CONDITION_SECTIONS } from "@/lib/marketing/conditions-catalog";
import { useDocumentMeta } from "@/lib/marketing/use-document-meta";

export const Route = createFileRoute("/conditions")({
  component: ConditionsPage,
});

function ConditionsPage() {
  useDocumentMeta(
    "MarkleTravelBooking Rental Conditions — Enterprise transparency",
    "Searchable rental conditions covering deposits, fuel policy, mileage, insurance, cancellations, and airport fees.",
  );

  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return CONDITION_SECTIONS;

    return CONDITION_SECTIONS.filter((section) => {
      const haystack =
        `${section.title} ${section.summary} ${section.badge} ${section.bullets.join(" ")}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [query]);

  return (
    <MarketingChrome>
      <article className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute right-[-20%] top-[-140px] h-72 w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,.18),transparent_74%)]" />

        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#93C5FD]">
          Policy transparency
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-[#F8FAFC] sm:text-5xl">
          Rental conditions dossier
        </h1>
        <p className="mt-5 text-base leading-relaxed text-[#94A3B8]">
          This playbook distills contractual concepts so travelers can escalate intelligently alongside their
          finance and risk teams—it does not supersede digitally signed confirmations or insurer filings.
        </p>

        <label className="relative mt-10 block">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#64748b]" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search keyword (for example mileage, waiver, Heathrow…)"
            className="rounded-2xl border-white/12 bg-[#0F172A]/70 py-7 pl-[3rem] text-[15px] text-[#F8FAFC] placeholder:text-[#64748b]"
          />
        </label>

        <div className="mt-14 space-y-5">
          {filtered.length === 0 ? (
            <p className="text-sm text-[#94A3B8]">
              Nothing matched that query—iterate your keyword breadth.
            </p>
          ) : null}

          <Accordion type="single" collapsible className="space-y-3">
            {filtered.map((section) => (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#0F172A]/70 backdrop-blur"
              >
                <AccordionTrigger className="px-5 py-4 text-left text-lg font-semibold text-[#F8FAFC] hover:no-underline">
                  <div className="flex flex-col gap-2 text-left md:flex-row md:items-start md:gap-6">
                    <IconBadge icon={section.icon} badge={section.badge} />
                    <span>{section.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border-t border-white/10 px-6 py-6 text-[15px] leading-relaxed text-[#CBD5F5]/86">
                  <div>
                    <p>{section.summary}</p>
                    <ul className="mt-6 space-y-3 text-sm text-[#E2E8F0]/80">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-3">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#F5B301]" aria-hidden />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </article>
    </MarketingChrome>
  );
}

function IconBadge({
  icon: Icon,
  badge,
}: {
  badge: string;
  icon: (typeof CONDITION_SECTIONS)[number]["icon"];
}) {
  return (
    <div className="inline-flex shrink-0 items-center gap-3 rounded-2xl border border-white/13 bg-black/52 px-3 py-3 text-[#F8FAFC] md:flex-col md:items-center md:justify-center md:rounded-3xl md:px-4">
      <Icon className="h-6 w-6 text-[#F5B301]" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#93C5FD]">{badge}</p>
    </div>
  );
}
