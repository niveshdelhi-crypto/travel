import { Injectable, NotFoundException } from "@nestjs/common";
import {
  AuditLogAction,
  BookingJobType,
  BookingLifecycleStatus,
  BookingStatus,
  Prisma,
} from "@prisma/client";
import { randomUUID } from "crypto";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogService } from "../../payments/services/audit-log.service";
import { BookingLifecycleService } from "./booking-lifecycle.service";
import { BookingJobProcessorService } from "./booking-job-processor.service";
import { TravelersService } from "./travelers.service";

export type InitiateBookingInput = {
  leadId: string;
  grossRevenue: number;
  currency?: string;
  partnerName?: string;
  confirmationReference?: string;
  notes?: string;
  supplierId?: string;
  vehicleId?: string;
  idempotencyKey?: string;
};

@Injectable()
export class BookingOrchestrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lifecycle: BookingLifecycleService,
    private readonly travelers: TravelersService,
    private readonly jobs: BookingJobProcessorService,
    private readonly auditLog: AuditLogService,
  ) {}

  async initiateFromLead(user: AuthenticatedUser, input: InitiateBookingInput) {
    const lead = await this.prisma.lead.findFirst({
      where:
        user.role === "sales_agent"
          ? { id: input.leadId, assigned_to: user.id }
          : { id: input.leadId },
    });

    if (!lead) {
      throw new NotFoundException("Lead not found or outside scope");
    }

    const idempotencyKey = input.idempotencyKey ?? `booking-${randomUUID()}`;
    const existing = await this.prisma.booking.findFirst({ where: { idempotency_key: idempotencyKey } });
    if (existing) return existing;

    const traveler = await this.travelers.upsertFromLead({
      email: lead.customer_email,
      fullName: lead.customer_name,
      phone: lead.customer_phone,
      actorId: user.id,
    });

    const currency = (input.currency ?? "USD").toUpperCase().slice(0, 3);
    const revenue = new Prisma.Decimal(input.grossRevenue);

    const booking = await this.prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          lead_id: lead.id,
          traveler_id: traveler.id,
          supplier_id: input.supplierId ?? null,
          vehicle_id: input.vehicleId ?? null,
          gross_revenue: revenue,
          currency,
          status: BookingStatus.PAYMENT_PENDING,
          lifecycle_status: BookingLifecycleStatus.BOOKING_REQUESTED,
          partner_name: input.partnerName?.trim() || null,
          confirmation_reference: input.confirmationReference?.trim() || null,
          notes: input.notes?.trim() || null,
          idempotency_key: idempotencyKey,
          recorded_by: user.id,
        },
      });

      await tx.lead.update({
        where: { id: lead.id },
        data: { traveler_id: traveler.id },
      });

      return created;
    });

    await this.lifecycle.transition(booking.id, BookingLifecycleStatus.PAYMENT_PENDING, {
      actorId: user.id,
      skipAudit: true,
    });

    await this.auditLog.log({
      action: AuditLogAction.BOOKING_CREATED,
      resourceType: "booking",
      resourceId: booking.id,
      userId: user.id,
      metadata: { leadId: lead.id, travelerId: traveler.id },
    });

    return booking;
  }

  async onPaymentSuccess(bookingId: string, actorId?: string, supplierId?: string) {
    await this.lifecycle.transition(bookingId, BookingLifecycleStatus.PAYMENT_SUCCESS, {
      actorId,
    });

    const booking = await this.prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { traveler: true },
    });

    if (booking.traveler_id) {
      await this.travelers.incrementBookingStats(
        booking.traveler_id,
        Number(booking.gross_revenue),
      );
    }

    await this.jobs.enqueue(bookingId, BookingJobType.GENERATE_INVOICE);

    if (supplierId ?? booking.supplier_id) {
      await this.jobs.enqueue(bookingId, BookingJobType.SUPPLIER_SYNC, {
        supplierId: supplierId ?? booking.supplier_id,
      });
    } else {
      await this.lifecycle.transition(bookingId, BookingLifecycleStatus.SUPPLIER_BOOKING_PENDING, {
        actorId,
      });
    }

    return booking;
  }

  async listOperationsQueue(page = 1, pageSize = 25) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(100, Math.max(10, pageSize));
    const skip = (safePage - 1) * safePageSize;

    const where = {
      lifecycle_status: {
        notIn: [BookingLifecycleStatus.COMPLETED, BookingLifecycleStatus.CANCELLED],
      },
    };

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          lead: {
            select: {
              customer_name: true,
              pickup_location: true,
              drop_location: true,
              assigned_to: true,
            },
          },
          traveler: { select: { id: true, full_name: true, is_recurring: true, is_vip: true } },
          supplier: { select: { id: true, name: true } },
        },
        orderBy: { updated_at: "desc" },
        skip,
        take: safePageSize,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { data, page: safePage, pageSize: safePageSize, total, totalPages: Math.max(1, Math.ceil(total / safePageSize)) };
  }
}
