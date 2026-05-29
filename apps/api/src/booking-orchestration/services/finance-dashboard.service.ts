import { Injectable } from "@nestjs/common";
import {
  BookingLifecycleStatus,
  PaymentStatus,
  RefundRequestStatus,
  SupplierBookingStatus,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class FinanceDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      revenueToday,
      revenueMonth,
      successfulTx,
      failedTx,
      pendingRefunds,
      recurringTravelers,
      supplierPending,
      topAgents,
    ] = await Promise.all([
      this.prisma.paymentTransaction.aggregate({
        where: {
          status: PaymentStatus.SUCCESS,
          processed_at: { gte: startOfDay },
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.paymentTransaction.aggregate({
        where: {
          status: PaymentStatus.SUCCESS,
          processed_at: { gte: startOfMonth },
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.paymentTransaction.count({ where: { status: PaymentStatus.SUCCESS } }),
      this.prisma.paymentTransaction.count({ where: { status: PaymentStatus.FAILED } }),
      this.prisma.refundRequest.count({
        where: {
          status: {
            in: [
              RefundRequestStatus.REFUND_REQUESTED,
              RefundRequestStatus.REFUND_APPROVED,
              RefundRequestStatus.REFUND_PROCESSING,
            ],
          },
        },
      }),
      this.prisma.traveler.count({ where: { is_recurring: true } }),
      this.prisma.supplierBooking.count({
        where: { status: { in: [SupplierBookingStatus.PENDING, SupplierBookingStatus.SUBMITTED] } },
      }),
      this.prisma.booking.groupBy({
        by: ["recorded_by"],
        _count: { id: true },
        _sum: { gross_revenue: true },
        where: { recorded_by: { not: null } },
        orderBy: { _sum: { gross_revenue: "desc" } },
        take: 5,
      }),
    ]);

    const gatewayStats = await this.prisma.paymentTransaction.groupBy({
      by: ["gateway_id", "status"],
      _count: { id: true },
    });

    const gateways = await this.prisma.paymentGateway.findMany({
      select: { id: true, name: true, type: true },
    });
    const gatewayMap = new Map(gateways.map((g) => [g.id, g]));

    const gatewaySuccessRate = gatewayStats.reduce<
      Record<string, { name: string; success: number; total: number; rate: number }>
    >((acc, row) => {
      const gateway = gatewayMap.get(row.gateway_id);
      const key = row.gateway_id;
      if (!acc[key]) {
        acc[key] = {
          name: gateway?.name ?? row.gateway_id,
          success: 0,
          total: 0,
          rate: 0,
        };
      }
      acc[key].total += row._count.id;
      if (row.status === PaymentStatus.SUCCESS) acc[key].success += row._count.id;
      acc[key].rate = acc[key].total ? acc[key].success / acc[key].total : 0;
      return acc;
    }, {});

    const agentIds = topAgents.map((a) => a.recorded_by).filter(Boolean) as string[];
    const agents = agentIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: agentIds } },
          select: { id: true, name: true },
        })
      : [];
    const agentNameMap = new Map(agents.map((a) => [a.id, a.name]));

    return {
      revenueToday: Number(revenueToday._sum.amount ?? 0),
      revenueMonth: Number(revenueMonth._sum.amount ?? 0),
      transactionsToday: revenueToday._count,
      transactionsMonth: revenueMonth._count,
      gatewaySuccessRate: Object.values(gatewaySuccessRate),
      successfulTransactions: successfulTx,
      failedTransactions: failedTx,
      pendingRefunds,
      recurringRevenueTravelers: recurringTravelers,
      supplierPayoutPending: supplierPending,
      bookingsInProgress: await this.prisma.booking.count({
        where: {
          lifecycle_status: {
            notIn: [BookingLifecycleStatus.COMPLETED, BookingLifecycleStatus.CANCELLED],
          },
        },
      }),
      topAgents: topAgents.map((row) => ({
        agentId: row.recorded_by,
        agentName: row.recorded_by ? agentNameMap.get(row.recorded_by) ?? "Unknown" : "Unknown",
        bookings: row._count.id,
        revenue: Number(row._sum.gross_revenue ?? 0),
      })),
    };
  }
}
