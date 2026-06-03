/** Editorial FAQ corpus — informational, non-contractual companion to `/conditions`. */
export const HOME_FAQ = [
  {
    q: "Is MarkleTravelBooking a direct supplier or a marketplace?",
    a: "MarkleTravelBooking behaves as an enterprise marketplace layer: concierge staff compare approved partners across your corridor, timing, and quality bar, rather than dumping anonymous inventory into one grid.",
  },
  {
    q: "Will I receive a verified quote?",
    a: "Your submission fans out to authenticated operations queues. Specialists reconcile partner availability against your SLA (pickup fidelity, baggage timing, chauffeur-style expectations).",
  },
  {
    q: "How do holds and payments work?",
    a: "The public intake collects zero card data by design. When the advisor selects a contracted path, deposits follow supplier policy under the disclosures summarized in `/conditions`.",
  },
  {
    q: "Can you honor corporate travel programs?",
    a: "Yes—note program IDs, traveler profiles, or duty-of-care mandates in optional comments after your first engagement. Larger teams should route procurement through Advisor login workflows.",
  },
  {
    q: "Which countries are serviced live?",
    a: "The catalog surfaced in `/countries` is provisioned solely from Postgres. If a geography returns empty rows, migrations or seed deployments have not propagated yet—the UI will show that plainly.",
  },
] as const;
