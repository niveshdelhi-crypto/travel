import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { LeadActivityAction, LeadStatus, Prisma, UserRole } from "@prisma/client";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import type { CloseLeadBookingDto } from "./dto/close-lead-booking.dto";

const bookingListInclude = {
  lead: {
    select: {
      id: true,
      customer_name: true,
      customer_email: true,
      pickup_location: true,
      drop_location: true,
      status: true,
      assigned_to: true,
    },
  },
  recorder: { select: { id: true, name: true, email: true } },
} satisfies Prisma.BookingInclude;

const paymentListInclude = {
  booking: {
    select: {
      id: true,
      gross_revenue: true,
      partner_name: true,
      confirmation_reference: true,
      lead: {
        select: {
          customer_name: true,
          pickup_location: true,
        },
      },
    },
  },
  recorder: { select: { id: true, name: true, email: true } },
} satisfies Prisma.PaymentInclude;

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  private bookingAccessWhere(user: AuthenticatedUser): Prisma.BookingWhereInput {
    if (user.role === UserRole.admin) return {};
    return { lead: { assigned_to: user.id } };
  }

  private paymentAccessWhere(user: AuthenticatedUser): Prisma.PaymentWhereInput {
    if (user.role === UserRole.admin) return {};
    return { booking: { lead: { assigned_to: user.id } } };
  }

  async listBookings(user: AuthenticatedUser, page = 1, pageSize = 25) {
    const pageSz = Math.min(100, Math.max(10, pageSize));
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * pageSz;
    const where = this.bookingAccessWhere(user);

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: bookingListInclude,
        orderBy: { created_at: "desc" },
        skip,
        take: pageSz,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data,
      page: safePage,
      pageSize: pageSz,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSz)),
    };
  }

  async listPayments(user: AuthenticatedUser, page = 1, pageSize = 25) {
    const pageSz = Math.min(100, Math.max(10, pageSize));
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * pageSz;
    const where = this.paymentAccessWhere(user);

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: paymentListInclude,
        orderBy: { created_at: "desc" },
        skip,
        take: pageSz,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data,
      page: safePage,
      pageSize: pageSz,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSz)),
    };
  }

  async closeLeadAsBooked(user: AuthenticatedUser, dto: CloseLeadBookingDto) {
    const leadWhere =
      user.role === UserRole.admin
        ? { id: dto.lead_id }
        : { id: dto.lead_id, assigned_to: user.id };

    const lead = await this.prisma.lead.findFirst({
      where: leadWhere,
      select: {
        id: true,
        status: true,
        assigned_to: true,
      },
    });

    if (!lead) throw new NotFoundException("Lead not found or outside your scope");
    if (lead.status !== LeadStatus.CONFIRMED) {
      throw new BadRequestException("Only CONFIRMED leads can be booked and closed through this flow");
    }

    const existingBooking = await this.prisma.booking.findUnique({
      where: { lead_id: lead.id },
      select: { id: true },
    });
    if (existingBooking) throw new ConflictException("This lead already has a booking record");

    const currency = (dto.currency ?? "USD").toUpperCase().slice(0, 3);
    const revenue = new Prisma.Decimal(dto.gross_revenue);

    const result = await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          lead_id: lead.id,
          gross_revenue: revenue,
          currency,
          partner_name: dto.partner_name?.trim() || null,
          confirmation_reference: dto.confirmation_reference?.trim() || null,
          notes: dto.notes?.trim() || null,
          recorded_by: user.id,
        },
      });

      await tx.payment.create({
        data: {
          booking_id: booking.id,
          amount: revenue,
          currency,
          kind: "booking_revenue",
          memo: dto.partner_name ? `Partner: ${dto.partner_name}` : "Lead booking revenue",
          recorded_by: user.id,
        },
      });

      if (lead.assigned_to && lead.status !== LeadStatus.COMPLETED) {
        await tx.user.update({
          where: { id: lead.assigned_to },
          data: { current_lead_count: { decrement: 1 } },
        });
      }

      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: LeadStatus.COMPLETED,
          booking_value: revenue,
        },
        select: {
          id: true,
          status: true,
          assigned_to: true,
          booking_value: true,
          customer_name: true,
          pickup_location: true,
          drop_location: true,
        },
      });

      await tx.leadActivity.create({
        data: {
          lead_id: lead.id,
          action: LeadActivityAction.BOOKING_RECORDED,
          performed_by: user.id,
          metadata: {
            booking_id: booking.id,
            gross_revenue: dto.gross_revenue,
            currency,
          },
        },
      });

      return { booking, updatedLead };
    });

    this.realtime.emitLeadUpdated({
      id: result.updatedLead.id,
      assigned_to: result.updatedLead.assigned_to,
    });

    return result;
  }
}
