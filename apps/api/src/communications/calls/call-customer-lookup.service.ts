import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { normalizeToE164 } from "../../common/utils/phone.util";

export type CustomerTier = "standard" | "recurring" | "vip" | "enterprise";

export type CallerContext = {
  is_existing_customer: boolean;
  phone_number: string;
  customer_name: string | null;
  lead_id: string | null;
  traveler_id: string | null;
  lifetime_revenue: number;
  bookings_count: number;
  last_booking: {
    id: string;
    gross_revenue: number;
    currency: string;
    created_at: Date;
    confirmation_reference: string | null;
  } | null;
  customer_tier: CustomerTier;
  recent_leads: Array<{
    id: string;
    status: string;
    created_at: Date;
    pickup_location: string;
    drop_location: string;
  }>;
};

@Injectable()
export class CallCustomerLookupService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveByPhone(rawPhone: string): Promise<CallerContext> {
    const phone = normalizeToE164(rawPhone);
    const phoneDigits = phone.replace(/\D/g, "");

    const traveler = await this.prisma.traveler.findFirst({
      where: {
        OR: [
          { phone },
          { phone: { contains: phoneDigits.slice(-10) } },
        ],
      },
    });

    const leads = await this.prisma.lead.findMany({
      where: {
        OR: [
          { customer_phone: phone },
          { customer_phone: { contains: phoneDigits.slice(-10) } },
        ],
      },
      orderBy: { created_at: "desc" },
      take: 5,
      include: {
        booking: {
          select: {
            id: true,
            gross_revenue: true,
            currency: true,
            created_at: true,
            confirmation_reference: true,
          },
        },
      },
    });

    const primaryLead = leads[0] ?? null;
    const travelerId = traveler?.id ?? primaryLead?.traveler_id ?? null;

    let lifetimeRevenue = 0;
    let bookingsCount = 0;
    let lastBooking: CallerContext["last_booking"] = null;

    if (travelerId) {
      const aggregates = await this.prisma.booking.aggregate({
        where: { traveler_id: travelerId },
        _sum: { gross_revenue: true },
        _count: { id: true },
      });
      lifetimeRevenue = Number(aggregates._sum.gross_revenue ?? 0);
      bookingsCount = aggregates._count.id;

      const latestBooking = await this.prisma.booking.findFirst({
        where: { traveler_id: travelerId },
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          gross_revenue: true,
          currency: true,
          created_at: true,
          confirmation_reference: true,
        },
      });
      if (latestBooking) {
        lastBooking = {
          id: latestBooking.id,
          gross_revenue: Number(latestBooking.gross_revenue),
          currency: latestBooking.currency,
          created_at: latestBooking.created_at,
          confirmation_reference: latestBooking.confirmation_reference,
        };
      }
    } else if (primaryLead?.booking) {
      lifetimeRevenue = Number(primaryLead.booking.gross_revenue);
      bookingsCount = 1;
      lastBooking = {
        id: primaryLead.booking.id,
        gross_revenue: Number(primaryLead.booking.gross_revenue),
        currency: primaryLead.booking.currency,
        created_at: primaryLead.booking.created_at,
        confirmation_reference: primaryLead.booking.confirmation_reference,
      };
    } else if (primaryLead?.customer_lifetime_value) {
      lifetimeRevenue = Number(primaryLead.customer_lifetime_value);
    }

    const travelerLtv = traveler ? Number(traveler.lifetime_value) : 0;
    if (travelerLtv > lifetimeRevenue) lifetimeRevenue = travelerLtv;

    const customerName =
      traveler?.full_name ?? primaryLead?.customer_name ?? null;

    const tier = this.resolveTier({
      isVip: traveler?.is_vip ?? false,
      isRecurring: traveler?.is_recurring ?? primaryLead?.is_recurring_customer ?? false,
      lifetimeRevenue,
      bookingsCount,
    });

    return {
      is_existing_customer: Boolean(traveler || primaryLead),
      phone_number: phone,
      customer_name: customerName,
      lead_id: primaryLead?.id ?? null,
      traveler_id: travelerId,
      lifetime_revenue: lifetimeRevenue,
      bookings_count: bookingsCount || traveler?.booking_count || 0,
      last_booking: lastBooking,
      customer_tier: tier,
      recent_leads: leads.map((lead) => ({
        id: lead.id,
        status: lead.status,
        created_at: lead.created_at,
        pickup_location: lead.pickup_location,
        drop_location: lead.drop_location,
      })),
    };
  }

  private resolveTier(input: {
    isVip: boolean;
    isRecurring: boolean;
    lifetimeRevenue: number;
    bookingsCount: number;
  }): CustomerTier {
    if (input.isVip || input.lifetimeRevenue >= 25_000) return "enterprise";
    if (input.bookingsCount >= 3 || input.lifetimeRevenue >= 5_000) {
      return "vip";
    }
    if (input.isRecurring || input.bookingsCount >= 1) return "recurring";
    return "standard";
  }
}
