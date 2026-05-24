import { Injectable } from "@nestjs/common";
import { LeadStatus, Prisma, UserRole } from "@prisma/client";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(_user: AuthenticatedUser) {
    const leadWhere: Prisma.LeadWhereInput = {};
    const bookingWhere: Prisma.BookingWhereInput = {};
    const paymentWhere: Prisma.PaymentWhereInput = {};
    const callWhere: Prisma.CallWhereInput = {};

    const [
      leadStatusGroups,
      totalLeads,
      convertedLeads,
      revenueAgg,
      bookingCount,
      paymentAgg,
      callStatusGroups,
      totalCalls,
      activeAgents,
      highQualityLeads,
      retainDueSoon,
    ] = await Promise.all([
      this.prisma.lead.groupBy({ by: ["status"], where: leadWhere, _count: { _all: true } }),
      this.prisma.lead.count({ where: leadWhere }),
      this.prisma.lead.count({
        where: {
          ...leadWhere,
          status: { in: [LeadStatus.CONFIRMED, LeadStatus.COMPLETED] },
        },
      }),
      this.prisma.lead.aggregate({
        where: {
          ...leadWhere,
          status: { in: [LeadStatus.CONFIRMED, LeadStatus.COMPLETED] },
        },
        _sum: { booking_value: true },
      }),
      this.prisma.booking.count({ where: bookingWhere }),
      this.prisma.payment.aggregate({
        where: paymentWhere,
        _sum: { amount: true },
      }),
      this.prisma.call.groupBy({ by: ["status"], where: callWhere, _count: { _all: true } }),
      this.prisma.call.count({ where: callWhere }),
      this.prisma.user.count({ where: { role: UserRole.sales_agent, is_active: true } }),
      this.prisma.lead.count({ where: { ...leadWhere, is_high_quality: true } }),
      this.prisma.lead.count({
        where: {
          ...leadWhere,
          is_high_quality: true,
          retain_until: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const statusCounts = Object.fromEntries(
      leadStatusGroups.map((row) => [row.status, row._count._all]),
    ) as Record<LeadStatus, number>;

    const callCounts = Object.fromEntries(
      callStatusGroups.map((row) => [row.status, row._count._all]),
    );

    return {
      leads: {
        total: totalLeads,
        converted: convertedLeads,
        conversion: totalLeads === 0 ? 0 : Math.round((convertedLeads / totalLeads) * 1000) / 10,
        pipelineRevenue: Number(revenueAgg._sum.booking_value ?? 0),
        statusCounts,
        highQuality: highQualityLeads,
        retainDueWithin7Days: retainDueSoon,
      },
      bookings: { total: bookingCount },
      payments: {
        totalRecognized: Number(paymentAgg._sum.amount ?? 0),
      },
      calls: {
        total: totalCalls,
        byStatus: callCounts,
      },
      team: { activeAgents },
    };
  }
}
