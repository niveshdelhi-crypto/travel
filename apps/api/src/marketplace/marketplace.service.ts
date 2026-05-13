import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { LeadStatus, MarketplaceDestinationKind, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const STATUS_LABELS: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: "Queued for desk review",
  [LeadStatus.CONTACTED]: "Advisor engaged",
  [LeadStatus.NEGOTIATING]: "Securing vehicle match",
  [LeadStatus.CONFIRMED]: "Itinerary confirmed",
  [LeadStatus.COMPLETED]: "Trip completed",
};

@Injectable()
export class MarketplaceService {
  constructor(private readonly prisma: PrismaService) {}

  async getTrustSnapshot() {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since120d = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);

    const [
      assistedRequestsLifetime,
      assistedRequests24h,
      advisoryCapacityAgents,
      statusGroups,
      avgRow,
      recentLeads,
    ] = await Promise.all([
      this.prisma.lead.count(),
      this.prisma.lead.count({ where: { created_at: { gte: since24h } } }),
      this.prisma.user.count({ where: { role: UserRole.sales_agent, is_active: true } }),
      this.prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
      this.prisma.$queryRaw<Array<{ avg_minutes: unknown }>>`
        SELECT AVG(EXTRACT(EPOCH FROM ("last_contacted_at" - "created_at")) / 60.0) AS avg_minutes
        FROM "leads"
        WHERE "last_contacted_at" IS NOT NULL
          AND "created_at" > ${since120d}
      `,
      this.prisma.lead.findMany({
        orderBy: { created_at: "desc" },
        take: 12,
        select: {
          pickup_location: true,
          status: true,
          created_at: true,
        },
      }),
    ]);

    const leadStatusBreakdown = Object.values(LeadStatus).reduce(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as Record<LeadStatus, number>,
    );
    for (const row of statusGroups) {
      leadStatusBreakdown[row.status] = row._count._all;
    }

    const rawAvg = avgRow[0]?.avg_minutes;
    const avgAdvisorResponseMinutes =
      rawAvg === null || rawAvg === undefined
        ? null
        : Number.isFinite(Number(rawAvg))
          ? Math.round(Number(rawAvg) * 10) / 10
          : null;

    return {
      assistedRequestsLifetime,
      assistedRequests24h,
      advisoryCapacityAgents,
      avgAdvisorResponseMinutes,
      leadStatusBreakdown,
      recentAssistanceSignals: recentLeads.map((lead) => ({
        corridorLabel: corridorFromPickup(lead.pickup_location),
        phaseLabel: STATUS_LABELS[lead.status],
        createdAt: lead.created_at.toISOString(),
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  listSuppliers() {
    return this.prisma.marketplaceSupplier.findMany({
      orderBy: [{ sort_order: "asc" }, { name: "asc" }],
    });
  }

  listTestimonials() {
    return this.prisma.marketplaceTestimonial.findMany({
      where: { is_editorial: true },
      orderBy: [{ sort_order: "asc" }, { created_at: "desc" }],
    });
  }

  listCountries() {
    return this.prisma.marketplaceCountry.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { destinations: true } },
      },
    });
  }

  async getCountry(slug: string) {
    const country = await this.prisma.marketplaceCountry.findUnique({
      where: { slug },
      include: {
        destinations: { orderBy: [{ kind: "asc" }, { name: "asc" }] },
      },
    });
    if (!country) throw new NotFoundException("Country not found");
    return country;
  }

  async getDestination(kind: MarketplaceDestinationKind, slug: string) {
    const destination = await this.prisma.marketplaceDestination.findUnique({
      where: { slug_kind: { slug, kind } },
      include: { country: true },
    });
    if (!destination) throw new NotFoundException("Destination not found");
    return destination;
  }

  listTrendingDestinations(limit = 8) {
    const take = Math.min(50, Math.max(1, limit));
    return this.prisma.marketplaceDestination.findMany({
      orderBy: [{ trend_score: "desc" }, { name: "asc" }],
      take,
      include: { country: { select: { slug: true, name: true, iso_code: true } } },
    });
  }

  async createSupplier(data: {
    name: string;
    slug?: string;
    website_url?: string;
    logo_url?: string;
    sort_order?: number;
  }) {
    const slug = (data.slug?.trim() || slugifyName(data.name)).slice(0, 80);
    try {
      return await this.prisma.marketplaceSupplier.create({
        data: {
          name: data.name.trim(),
          slug,
          website_url: data.website_url?.trim() || null,
          logo_url: data.logo_url?.trim() || null,
          sort_order: data.sort_order ?? 100,
        },
      });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "P2002") {
        throw new ConflictException("A supplier with this slug already exists");
      }
      throw error;
    }
  }

  async updateSupplier(
    id: string,
    data: {
      name?: string;
      slug?: string;
      website_url?: string | null;
      logo_url?: string | null;
      sort_order?: number;
    },
  ) {
    try {
      return await this.prisma.marketplaceSupplier.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name.trim() } : {}),
          ...(data.slug !== undefined ? { slug: data.slug.trim().slice(0, 80) } : {}),
          ...(data.website_url !== undefined ? { website_url: data.website_url } : {}),
          ...(data.logo_url !== undefined ? { logo_url: data.logo_url } : {}),
          ...(data.sort_order !== undefined ? { sort_order: data.sort_order } : {}),
        },
      });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error) {
        const code = (error as { code?: string }).code;
        if (code === "P2025") throw new NotFoundException("Supplier not found");
        if (code === "P2002") throw new ConflictException("A supplier with this slug already exists");
      }
      throw error;
    }
  }

  async deleteSupplier(id: string) {
    try {
      await this.prisma.marketplaceSupplier.delete({ where: { id } });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "P2025") {
        throw new NotFoundException("Supplier not found");
      }
      throw error;
    }
  }
}

function slugifyName(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.length ? base : "partner";
}

function corridorFromPickup(pickup: string) {
  const head = pickup.split(",")[0]?.trim() ?? pickup.trim();
  if (!head) return "Corridor redacted";
  return head.length > 42 ? `${head.slice(0, 39)}…` : head;
}
