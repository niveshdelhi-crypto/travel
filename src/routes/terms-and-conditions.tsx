import { createFileRoute } from "@tanstack/react-router";

import { MarketingChrome } from "@/components/marketing/marketing-chrome";
import { useDocumentMeta } from "@/lib/marketing/use-document-meta";

export const Route = createFileRoute("/terms-and-conditions")({
  component: TermsPage,
});

function TermsPage() {
  useDocumentMeta(
    "MarkleTravelBooking Terms & Conditions",
    "Marketplace terms governing concierge booking requests, liability allocation, communications consent, force majeure, governing law, and arbitration posture.",
  );

  return (
    <MarketingChrome>
      <article className="prose prose-invert prose-headings:text-[#F8FAFC] mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 prose-p:text-[#CBD5F5]/90">
        <h1 className="text-4xl font-semibold tracking-tight">Terms &amp; conditions</h1>
        <p className="lead text-[#94A3B8]">
          These terms govern visitors of the public marketing surface, intake forms, and catalog routes. When
          you execute a Master Services Agreement, that agreement supersedes conflicting sections below.
        </p>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">1. Nature of service</h2>
          <p className="mt-4 text-base leading-relaxed">
            MarkleTravelBooking assists with routing premium rental demand to verified partners. We are not the lessor
            of record unless explicitly contracted; liability chains follow the executed rental agreement and
            applicable insurance stack.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">2. Communications consent</h2>
          <p className="mt-4 text-base leading-relaxed">
            Submitting `/api/leads/public` requests authorizes operational contact until you withdraw consent
            or the engagement completes. Marketing SMS requires separate double opt-in—this intake is
            service-of-process oriented, not promotional spam.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">3. Availability &amp; pricing</h2>
          <p className="mt-4 text-base leading-relaxed">
            Catalog entries describe routing intent, not live inventory. Final pricing, taxes, airport
            surcharges, and waiver economics appear only after partner confirmations land in audited PDFs or
            e-contract flows.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">4. Intellectual property</h2>
          <p className="mt-4 text-base leading-relaxed">
            UI chrome, typography pairings, motion behaviors, photographic assets in this SPA, plus `GET
            /marketplace/*` payloads remain MarkleTravelBooking or licensor IP; scraping for model training violates
            these terms absent written consent.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">5. Limitation &amp; law</h2>
          <p className="mt-4 text-base leading-relaxed">
            To the maximum extent permitted by law, MarkleTravelBooking disclaims incidental damages arising from ETA
            miscalculations, partner outages, or force-majeure—subject to carve-outs for intentional
            misconduct. Venue defaults to MarkleTravelBooking’ corporate domicile unless enterprise contracts steer
            elsewhere.
          </p>
        </section>
      </article>
    </MarketingChrome>
  );
}
