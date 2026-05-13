import { useQuery } from "@tanstack/react-query";
import { marketplaceService } from "@/services";
import { marketplaceQueryKeys } from "@/lib/marketing/query-keys";

export function useMarketplaceTrustSnapshot() {
  return useQuery({
    queryKey: marketplaceQueryKeys.trustSnapshot(),
    queryFn: marketplaceService.trustSnapshot,
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: 2,
  });
}

export function useMarketplaceSuppliers() {
  return useQuery({
    queryKey: marketplaceQueryKeys.suppliers(),
    queryFn: marketplaceService.suppliers,
    staleTime: 10 * 60_000,
    retry: 2,
  });
}

export function useMarketplaceTestimonials() {
  return useQuery({
    queryKey: marketplaceQueryKeys.testimonials(),
    queryFn: marketplaceService.testimonials,
    staleTime: 10 * 60_000,
    retry: 2,
  });
}

export function useMarketplaceCountries() {
  return useQuery({
    queryKey: marketplaceQueryKeys.countries(),
    queryFn: marketplaceService.countries,
    staleTime: 10 * 60_000,
    retry: 2,
  });
}

export function useMarketplaceCountry(slug: string) {
  return useQuery({
    queryKey: marketplaceQueryKeys.country(slug),
    queryFn: () => marketplaceService.country(slug),
    enabled: Boolean(slug),
    staleTime: 10 * 60_000,
    retry: 2,
  });
}

export function useTrendingDestinations(limit = 8) {
  return useQuery({
    queryKey: marketplaceQueryKeys.trending(limit),
    queryFn: () => marketplaceService.trendingDestinations(limit),
    staleTime: 10 * 60_000,
    retry: 2,
  });
}

export function useDestinationCity(slug: string) {
  return useQuery({
    queryKey: marketplaceQueryKeys.destinationCity(slug),
    queryFn: () => marketplaceService.destinationCity(slug),
    enabled: Boolean(slug),
    staleTime: 10 * 60_000,
    retry: 2,
  });
}

export function useDestinationAirport(slug: string) {
  return useQuery({
    queryKey: marketplaceQueryKeys.destinationAirport(slug),
    queryFn: () => marketplaceService.destinationAirport(slug),
    enabled: Boolean(slug),
    staleTime: 10 * 60_000,
    retry: 2,
  });
}
