import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  AuditLogAction,
  BookingLifecycleStatus,
  BookingStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { AuditLogService } from "../../payments/services/audit-log.service";
import {
  BOOKING_LIFECYCLE_TRANSITIONS,
  BOOKING_STATUS_MAP,
} from "../constants/booking-lifecycle.constants";

export type LifecycleTransitionContext = {
  actorId?: string;
  ipAddress?: string;
  payload?: Prisma.InputJsonValue;
  skipAudit?: boolean;
};

@Injectable()
export class BookingLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly realtime: RealtimeGateway,
  ) {}

  assertTransition(from: BookingLifecycleStatus, to: BookingLifecycleStatus) {
    if (from === to) return;
    const allowed = BOOKING_LIFECYCLE_TRANSITIONS[from];
    if (!allowed?.includes(to)) {
      throw new BadRequestException(
        `Invalid booking lifecycle transition from ${from} to ${to}`,
      );
    }
  }

  async getBookingOrThrow(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        lead: { select: { id: true, assigned_to: true, customer_name: true } },
        traveler: { select: { id: true, email: true, full_name: true } },
      },
    });
    if (!booking) throw new NotFoundException("Booking not found");
    return booking;
  }

  async transition(
    bookingId: string,
    toStatus: BookingLifecycleStatus,
    context: LifecycleTransitionContext = {},
  ) {
    const booking = await this.getBookingOrThrow(bookingId);
    this.assertTransition(booking.lifecycle_status, toStatus);

    const legacyStatus = BOOKING_STATUS_MAP[toStatus];

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.booking.update({
        where: { id: bookingId },
        data: {
          lifecycle_status: toStatus,
          ...(legacyStatus ? { status: legacyStatus as BookingStatus } : {}),
        },
        include: {
          lead: { select: { id: true, assigned_to: true } },
          traveler: { select: { id: true, full_name: true, email: true } },
        },
      });

      await tx.bookingLifecycleEvent.create({
        data: {
          booking_id: bookingId,
          from_status: booking.lifecycle_status,
          to_status: toStatus,
          actor_id: context.actorId ?? null,
          ip_address: context.ipAddress ?? null,
          payload: context.payload ?? undefined,
        },
      });

      return next;
    });

    if (!context.skipAudit) {
      await this.auditLog.log({
        action: AuditLogAction.BOOKING_LIFECYCLE_TRANSITION,
        resourceType: "booking",
        resourceId: bookingId,
        userId: context.actorId,
        ipAddress: context.ipAddress,
        metadata: {
          from: booking.lifecycle_status,
          to: toStatus,
          ...(context.payload ? { payload: context.payload } : {}),
        },
      });
    }

    this.emitLifecycleRealtime(updated, toStatus);

    return updated;
  }

  async getTimeline(bookingId: string) {
    return this.prisma.bookingLifecycleEvent.findMany({
      where: { booking_id: bookingId },
      orderBy: { created_at: "asc" },
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  private emitLifecycleRealtime(
    booking: {
      id: string;
      lead_id: string;
      lifecycle_status: BookingLifecycleStatus;
      lead: { assigned_to: string | null };
    },
    toStatus: BookingLifecycleStatus,
  ) {
    const payload = {
      id: booking.id,
      lead_id: booking.lead_id,
      status: toStatus,
      lifecycle_status: booking.lifecycle_status,
      assigned_to: booking.lead.assigned_to,
    };

    if (toStatus === BookingLifecycleStatus.BOOKING_REQUESTED) {
      this.realtime.emitBookingCreated(payload);
    } else if (toStatus === BookingLifecycleStatus.BOOKING_CONFIRMED) {
      this.realtime.emitBookingConfirmed({
        id: booking.id,
        lead_id: booking.lead_id,
        status: toStatus,
        assigned_to: booking.lead.assigned_to,
      });
    } else if (
      toStatus === BookingLifecycleStatus.BOOKING_FAILED ||
      toStatus === BookingLifecycleStatus.PAYMENT_FAILED
    ) {
      this.realtime.emitBookingFailed(payload);
    }
  }
}
