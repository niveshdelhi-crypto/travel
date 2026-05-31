import { Injectable } from "@nestjs/common";
import { CallDirection, CallStatus, Prisma, UserRole } from "@prisma/client";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CallCenterMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics(user: AuthenticatedUser) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const agentFilter: Prisma.CallWhereInput =
      user.role === UserRole.admin ? {} : { agent_id: user.id };

    const todayWhere: Prisma.CallWhereInput = {
      ...agentFilter,
      started_at: { gte: startOfDay },
    };

    const [
      todaysCalls,
      connectedCalls,
      missedCalls,
      durationAgg,
      bookingsCreated,
      revenueAgg,
    ] = await Promise.all([
      this.prisma.call.count({ where: todayWhere }),
      this.prisma.call.count({
        where: {
          ...todayWhere,
          status: { in: [CallStatus.ANSWERED, CallStatus.COMPLETED] },
        },
      }),
      this.prisma.call.count({
        where: {
          ...todayWhere,
          status: { in: [CallStatus.NO_ANSWER, CallStatus.BUSY, CallStatus.VOICEMAIL] },
        },
      }),
      this.prisma.call.aggregate({
        where: {
          ...todayWhere,
          duration_seconds: { not: null },
        },
        _avg: { duration_seconds: true },
      }),
      this.prisma.booking.count({
        where: {
          created_at: { gte: startOfDay },
          ...(user.role === UserRole.admin
            ? {}
            : {
                lead: { assigned_to: user.id },
              }),
        },
      }),
      this.prisma.booking.aggregate({
        where: {
          created_at: { gte: startOfDay },
          ...(user.role === UserRole.admin
            ? {}
            : {
                lead: { assigned_to: user.id },
              }),
        },
        _sum: { gross_revenue: true },
      }),
    ]);

    const inboundToday = await this.prisma.call.count({
      where: {
        ...todayWhere,
        direction: CallDirection.INBOUND,
      },
    });

    return {
      todays_calls: todaysCalls,
      inbound_calls_today: inboundToday,
      connected_calls: connectedCalls,
      missed_calls: missedCalls,
      average_duration_seconds: Math.round(durationAgg._avg.duration_seconds ?? 0),
      bookings_created: bookingsCreated,
      revenue_generated: Number(revenueAgg._sum.gross_revenue ?? 0),
      as_of: new Date().toISOString(),
    };
  }
}
