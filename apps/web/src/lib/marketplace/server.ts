import { SUPPLIERS } from "@/modules/landing/lib/constants";
import type { MarketplaceSupplier } from "./types";

const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://localhost:4000/api";

export function fallbackMarketplaceSuppliers(): MarketplaceSupplier[] {
  return SUPPLIERS.map((name, index) => ({
    id: `fallback-${name.toLowerCase()}`,
    name,
    slug: name.toLowerCase(),
    website_url: null,
    logo_url: null,
    sort_order: index,
  }));
}

export async function getServerMarketplaceSuppliers(): Promise<MarketplaceSupplier[]> {
  try {
    const response = await fetch(`${API_INTERNAL_URL}/marketplace/suppliers`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) return fallbackMarketplaceSuppliers();

    const data = (await response.json()) as MarketplaceSupplier[];
    return Array.isArray(data) && data.length > 0 ? data : fallbackMarketplaceSuppliers();
  } catch {
    return fallbackMarketplaceSuppliers();
  }
}
