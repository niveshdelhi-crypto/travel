import { Controller, Get, Param, Query } from "@nestjs/common";
import { MarketplaceDestinationKind } from "@prisma/client";
import { Public } from "../common/decorators/public.decorator";
import { MarketplaceService } from "./marketplace.service";

@Controller("marketplace")
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Public()
  @Get("trust-snapshot")
  trustSnapshot() {
    return this.marketplaceService.getTrustSnapshot();
  }

  @Public()
  @Get("suppliers")
  suppliers() {
    return this.marketplaceService.listSuppliers();
  }

  @Public()
  @Get("testimonials")
  testimonials() {
    return this.marketplaceService.listTestimonials();
  }

  @Public()
  @Get("countries")
  countries() {
    return this.marketplaceService.listCountries();
  }

  @Public()
  @Get("countries/:slug")
  country(@Param("slug") slug: string) {
    return this.marketplaceService.getCountry(slug);
  }

  @Public()
  @Get("destinations/trending")
  trendingDestinations(@Query("limit") limitRaw?: string) {
    let limit: number | undefined;
    if (limitRaw !== undefined && limitRaw !== "") {
      const parsed = Number.parseInt(limitRaw, 10);
      if (Number.isFinite(parsed)) limit = parsed;
    }
    return this.marketplaceService.listTrendingDestinations(limit);
  }

  @Public()
  @Get("destinations/city/:slug")
  destinationCity(@Param("slug") slug: string) {
    return this.marketplaceService.getDestination(MarketplaceDestinationKind.CITY, slug);
  }

  @Public()
  @Get("destinations/airport/:slug")
  destinationAirport(@Param("slug") slug: string) {
    return this.marketplaceService.getDestination(MarketplaceDestinationKind.AIRPORT, slug);
  }
}
