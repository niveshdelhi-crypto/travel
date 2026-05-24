import { createFileRoute } from "@tanstack/react-router";

import { MarketingChrome } from "@/components/marketing/marketing-chrome";
import { useDocumentMeta } from "@/lib/marketing/use-document-meta";

export const Route = createFileRoute("/privacy-policy")({
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  useDocumentMeta(
    "Book my Carz Privacy Policy",
    "Book my Carz data handling posture for concierge bookings, Postgres CRM metadata, telemetry, analytics, cookies, jurisdictions, subprocessors, traveler rights.",
  );

  const sections = [
    {
      heading: "1. Stewardship posture",
      body: "Book my Carz processes traveler contact data strictly to originate rental assistance engagements. Sensitive payment credentials never transit the anonymous landing funnel—payments route through audited suppliers once advisors formalize confirmations.",
    },
    {
      heading: "2. Lawful bases & geography",
      body: "Global travelers may ingest this platform; controllers respect GDPR, CPRA-aligned expectations, UAE PDPL concepts, UK GDPR tailoring, plus sector guidance for transportation partners. Contracts with enterprise buyers override where enterprise DPAs dictate.",
    },
    {
      heading: "3. Data categories",
      body: "Routing strings, itineraries, concierge notes, websocket metrics, Postgres audit timestamps, SSO sessions (for advisors only), anomaly detection logs.",
    },
    {
      heading: "4. Retention mechanics",
      body: "Operational teams define retention ladders per tenant. Default CRM retention aligns with bookkeeping requirements for rental economics—purge tickets open through security@bookmycarz.com alias once legal holds resolve.",
    },
    {
      heading: "5. Rights & escalation",
      body: "Individuals may invoke access/export/deletion workflows subject to AML or dispute preservation carve-outs described in annexes routed through counsel.",
    },
  ];

  return (
    <MarketingChrome>
      <article className="prose prose-invert prose-headings:text-[#F8FAFC] mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 prose-p:text-[#CBD5F5]/90">
        <h1 className="text-4xl font-semibold tracking-tight">Privacy policy</h1>
        <p className="lead text-[#94A3B8]">
          Last reviewed {new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })} — legal
          teams should diff this copy against executed Data Processing Agreements.
        </p>
        {sections.map((section) => (
          <section key={section.heading} className="mt-10">
            <h2 className="text-2xl font-semibold">{section.heading}</h2>
            <p className="mt-4 text-base leading-relaxed">{section.body}</p>
          </section>
        ))}
      </article>
    </MarketingChrome>
  );
}
