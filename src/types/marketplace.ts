// ============================================================
// FleetNexus — Marketplace / public SEO catalog types
// ============================================================

export type MarketplaceTrustSnapshot = {
  assistedRequestsLifetime: number;
  assistedRequests24h: number;
  advisoryCapacityAgents: number;
  avgAdvisorResponseMinutes: number | null;
  leadStatusBreakdown: Record<string, number>;
  recentAssistanceSignals: Array<{
    corridorLabel: string;
    phaseLabel: string;
    createdAt: string;
  }>;
  generatedAt: string;
};

export type MarketplaceSupplier = {
  id: string;
  name: string;
  slug: string;
  website_url: string | null;
  logo_url: string | null;
  sort_order: number;
  created_at: string;
};

export type MarketplaceTestimonial = {
  id: string;
  seed_key: string | null;
  quote: string;
  author_display: string;
  meta_line: string | null;
  rating: number;
  is_editorial: boolean;
  sort_order: number;
  created_at: string;
};

export type MarketplaceCountrySummary = {
  id: string;
  slug: string;
  name: string;
  iso_code: string;
  headline: string | null;
  created_at: string;
  _count: { destinations: number };
};

export type MarketplaceCountryDetail = Omit<MarketplaceCountrySummary, "_count"> & {
  destinations: MarketplaceDestinationBrief[];
};

export type MarketplaceDestinationBrief = {
  id: string;
  slug: string;
  kind: "CITY" | "AIRPORT";
  name: string;
  subtitle: string | null;
  iata_code: string | null;
  country_id: string;
  seo_title: string | null;
  seo_description: string | null;
  trend_score: number;
  created_at: string;
};

export type MarketplaceDestinationDetail = MarketplaceDestinationBrief & {
  country: Pick<MarketplaceCountrySummary, "slug" | "name" | "iso_code">;
};
