import { Injectable } from "@nestjs/common";
import { AuditLogAction, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogService } from "../../payments/services/audit-log.service";

export type UpsertTravelerInput = {
  email: string;
  fullName: string;
  phone?: string;
  actorId?: string;
};

@Injectable()
export class TravelersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async upsertFromLead(input: UpsertTravelerInput) {
    const email = input.email.trim().toLowerCase();
    const existing = await this.prisma.traveler.findUnique({ where: { email } });

    if (existing) {
      const updated = await this.prisma.traveler.update({
        where: { id: existing.id },
        data: {
          full_name: input.fullName.trim(),
          phone: input.phone?.trim() || existing.phone,
          booking_count: { increment: 0 },
          is_recurring: existing.booking_count >= 1,
        },
      });

      await this.auditLog.log({
        action: AuditLogAction.TRAVELER_UPDATED,
        resourceType: "traveler",
        resourceId: updated.id,
        userId: input.actorId,
      });

      return updated;
    }

    const created = await this.prisma.traveler.create({
      data: {
        email,
        full_name: input.fullName.trim(),
        phone: input.phone?.trim() || null,
      },
    });

    await this.auditLog.log({
      action: AuditLogAction.TRAVELER_CREATED,
      resourceType: "traveler",
      resourceId: created.id,
      userId: input.actorId,
    });

    return created;
  }

  async incrementBookingStats(travelerId: string, revenue: number) {
    const traveler = await this.prisma.traveler.update({
      where: { id: travelerId },
      data: {
        booking_count: { increment: 1 },
        is_recurring: true,
        lifetime_value: { increment: revenue },
      },
    });

    if (traveler.booking_count === 1) {
      await this.prisma.traveler.update({
        where: { id: travelerId },
        data: { is_recurring: false },
      });
    }

    return traveler;
  }

  async list(page = 1, pageSize = 25, filters?: { recurringOnly?: boolean; vipOnly?: boolean }) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(100, Math.max(10, pageSize));
    const skip = (safePage - 1) * safePageSize;

    const where: Prisma.TravelerWhereInput = {};
    if (filters?.recurringOnly) where.is_recurring = true;
    if (filters?.vipOnly) where.is_vip = true;

    const [data, total] = await Promise.all([
      this.prisma.traveler.findMany({
        where,
        orderBy: { updated_at: "desc" },
        skip,
        take: safePageSize,
        include: {
          _count: { select: { bookings: true, notes: true } },
        },
      }),
      this.prisma.traveler.count({ where }),
    ]);

    return {
      data,
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    };
  }

  async getById(id: string) {
    return this.prisma.traveler.findUniqueOrThrow({
      where: { id },
      include: {
        notes: {
          orderBy: { created_at: "desc" },
          take: 20,
          include: { author: { select: { id: true, name: true } } },
        },
        preferences: true,
        documents: { orderBy: { created_at: "desc" }, take: 10 },
        bookings: {
          orderBy: { created_at: "desc" },
          take: 10,
          select: {
            id: true,
            lifecycle_status: true,
            gross_revenue: true,
            currency: true,
            created_at: true,
          },
        },
      },
    });
  }

  async addNote(travelerId: string, body: string, authorId?: string) {
    return this.prisma.travelerNote.create({
      data: {
        traveler_id: travelerId,
        body: body.trim(),
        author_id: authorId ?? null,
      },
    });
  }

  async updateRiskScore(travelerId: string, riskScore: number, fraudFlags?: Prisma.InputJsonValue) {
    return this.prisma.traveler.update({
      where: { id: travelerId },
      data: {
        risk_score: Math.max(0, Math.min(100, riskScore)),
        fraud_flags: fraudFlags ?? undefined,
      },
    });
  }
}
