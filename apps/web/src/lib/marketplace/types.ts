export type MarketplaceSupplier = {
  id: string;
  name: string;
  slug: string;
  website_url: string | null;
  logo_url: string | null;
  sort_order: number;
  created_at?: string;
};
