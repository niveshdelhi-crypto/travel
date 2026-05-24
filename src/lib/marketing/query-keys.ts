// ============================================================
// Book my Carz — Marketplace TanStack Query keys
// ============================================================

export const marketplaceQueryKeys = {
  all: ["marketplace"] as const,
  trustSnapshot: () => [...marketplaceQueryKeys.all, "trustSnapshot"] as const,
  suppliers: () => [...marketplaceQueryKeys.all, "suppliers"] as const,
  testimonials: () => [...marketplaceQueryKeys.all, "testimonials"] as const,
  countries: () => [...marketplaceQueryKeys.all, "countries"] as const,
  country: (slug: string) => [...marketplaceQueryKeys.all, "country", slug] as const,
  trending: (limit?: number) => [...marketplaceQueryKeys.all, "trending", limit ?? "default"] as const,
  destinationCity: (slug: string) =>
    [...marketplaceQueryKeys.all, "destination", "city", slug] as const,
  destinationAirport: (slug: string) =>
    [...marketplaceQueryKeys.all, "destination", "airport", slug] as const,
};
