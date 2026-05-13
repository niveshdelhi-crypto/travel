import { Link, createFileRoute } from "@tanstack/react-router";
import { LifeBuoy } from "lucide-react";

import { MarketingChrome } from "@/components/marketing/marketing-chrome";
import { useDocumentMeta } from "@/lib/marketing/use-document-meta";

export const Route = createFileRoute("/help-center")({
  component: HelpCenterPage,
});

type Guide =
  | {
      title: string;
      body: string;
      to: "/" | "/countries" | "/login" | "/conditions";
      hash?: undefined;
    }
  | {
      title: string;
      body: string;
      to: "/";
      hash: string;
    };

function HelpCenterPage() {
  useDocumentMeta(
    "FleetNexus Help Center — Operations & Travelers",
    "Links to marketplace catalog routes, concierge intake, advisors login, rental conditions, privacy, and SOC-minded guidance.",
  );

  const guides: Guide[] = [
    {
      title: "Start assisted booking",
      body: "Use the kinetic widget on `/`—it posts securely to NestJS `POST /api/leads/public` with optimistic UI + retry ergonomics baked in TanStack Mutation logic.",
      to: "/",
      hash: "lead-form",
    },
    {
      title: "Browse audited geography",
      body: "`GET /marketplace/countries` powers `/countries`; empty grids mean migrations have not propagated to that database URL.",
      to: "/countries",
    },
    {
      title: "Advisors workspace",
      body: "Authenticated `/app` routes hydrate through cookie sessions plus JWT interplay—SOC reviews should verify refresh token posture.",
      to: "/login",
    },
    {
      title: "Rental legal stack",
      body: "Layer `/conditions`, `/terms-and-conditions`, and `/privacy-policy` for comprehensive governance storytelling.",
      to: "/conditions",
    },
  ];

  return (
    <MarketingChrome>
      <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[#F5B301]/40 bg-[#0F172A]/80 text-[#F5B301]">
            <LifeBuoy className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#93C5FD]">
              Help center
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-[#F8FAFC]">Operational connective tissue</h1>
          </div>
        </div>

        <p className="mt-6 max-w-3xl text-base leading-relaxed text-[#94A3B8]">
          This index is intentionally lightweight: every card below links to a route already instrumented in
          TanStack Router and backed by either Prisma reads or enterprise legal prose maintained in-repo.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {guides.map((guide) =>
            guide.hash ? (
              <Link
                key={guide.title}
                to={guide.to}
                hash={guide.hash}
                className="rounded-3xl border border-white/10 bg-[#0F172A]/70 p-6 transition hover:border-[#3B82F6]/40"
              >
                <h2 className="text-xl font-semibold text-[#F8FAFC]">{guide.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[#CBD5F5]/80">{guide.body}</p>
                <span className="mt-5 inline-flex text-[13px] font-semibold text-[#60A5FA]">Open guide →</span>
              </Link>
            ) : (
              <Link
                key={guide.title}
                to={guide.to}
                className="rounded-3xl border border-white/10 bg-[#0F172A]/70 p-6 transition hover:border-[#3B82F6]/40"
              >
                <h2 className="text-xl font-semibold text-[#F8FAFC]">{guide.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[#CBD5F5]/80">{guide.body}</p>
                <span className="mt-5 inline-flex text-[13px] font-semibold text-[#60A5FA]">Open guide →</span>
              </Link>
            ),
          )}
        </div>
      </article>
    </MarketingChrome>
  );
}
