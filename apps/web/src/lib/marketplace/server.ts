import { SUPPLIERS } from "@/modules/landing/lib/constants";
import type { MarketplaceSupplier } from "./types";

const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://localhost:4000/api";

const FALLBACK_SUPPLIER_LOGOS: Record<string, string> = {
  hertz: "/suppliers/hertz.svg",
  avis: "/suppliers/avis.svg",
  enterprise: "/suppliers/enterprise.svg",
  national: "/suppliers/national.svg",
};

function fallbackSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function fallbackMarketplaceSuppliers(): MarketplaceSupplier[] {
  return SUPPLIERS.map((name, index) => {
    const slug = fallbackSlug(name);
    return {
      id: `fallback-${slug}`,
      name,
      slug,
      website_url: null,
      logo_url: FALLBACK_SUPPLIER_LOGOS[slug] ?? null,
      sort_order: index,
    };
  });
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
