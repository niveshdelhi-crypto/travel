import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AuditLogAction,
  BookingStatus,
  PaymentStatus,
  Prisma,
  UserRole,
} from "@prisma/client";
import { randomUUID } from "crypto";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user";
import { PrismaService } from "../../prisma/prisma.service";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { hasFinanceAccess } from "../constants/payment-roles.constants";
import type { CreateBookingPaymentRequestDto } from "../dto/create-booking-payment-request.dto";
import { GatewayRegistryService } from "./gateway-registry.service";
import { PaymentTransactionService } from "./payment-transaction.service";
import { AuditLogService } from "./audit-log.service";

const paymentRequestInclude = {
  booking: {
    select: {
      id: true,
      lead_id: true,
      gross_revenue: true,
      currency: true,
      status: true,
      lead: {
        select: {
          customer_name: true,
          assigned_to: true,
        },
      },
    },
  },
  gateway: { select: { id: true, name: true, type: true, is_active: true } },
  requester: { select: { id: true, name: true, email: true } },
  transactions: {
    orderBy: { created_at: "desc" as const },
    take: 5,
  },
} satisfies Prisma.BookingPaymentRequestInclude;

@Injectable()
export class BookingPaymentWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gatewayRegistry: GatewayRegistryService,
    private readonly transactionService: PaymentTransactionService,
    private readonly auditLog: AuditLogService,
    private readonly realtime: RealtimeGateway,
  ) {}

  private paymentRequestAccessWhere(
    user: AuthenticatedUser,
  ): Prisma.BookingPaymentRequestWhereInput {
    if (hasFinanceAccess(user.role)) return {};
    return { booking: { lead: { assigned_to: user.id } } };
  }

  async listPaymentRequests(user: AuthenticatedUser, page = 1, pageSize = 25) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(100, Math.max(10, pageSize));
    const skip = (safePage - 1) * safePageSize;
    const where = this.paymentRequestAccessWhere(user);

    const [data, total] = await Promise.all([
      this.prisma.bookingPaymentRequest.findMany({
        where,
        include: paymentRequestInclude,
        orderBy: { created_at: "desc" },
        skip,
        take: safePageSize,
      }),
      this.prisma.bookingPaymentRequest.count({ where }),
    ]);

    return {
      data,
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    };
  }

  async getPaymentRequest(user: AuthenticatedUser, requestId: string) {
    const request = await this.prisma.bookingPaymentRequest.findFirst({
      where: { id: requestId, ...this.paymentRequestAccessWhere(user) },
      include: paymentRequestInclude,
    });

    if (!request) throw new NotFoundException("Booking payment request not found");
    return request;
  }

  async createPaymentRequest(user: AuthenticatedUser, dto: CreateBookingPaymentRequestDto) {
    const bookingWhere =
      user.role === UserRole.sales_agent
        ? { id: dto.booking_id, lead: { assigned_to: user.id } }
        : { id: dto.booking_id };

    const booking = await this.prisma.booking.findFirst({
      where: bookingWhere,
      select: { id: true, currency: true, status: true, gross_revenue: true },
    });

    if (!booking) throw new NotFoundException("Booking not found or outside your scope");

    const gateway = await this.prisma.paymentGateway.findFirst({
      where: { id: dto.gateway_id, is_active: true },
    });
    if (!gateway) throw new NotFoundException("Active payment gateway not found");

    const idempotencyKey = dto.idempotency_key ?? `pay-req-${randomUUID()}`;
    const existing = await this.prisma.bookingPaymentRequest.findUnique({
      where: { idempotency_key: idempotencyKey },
    });
    if (existing) return this.getPaymentRequest(user, existing.id);

    const amount = dto.amount ?? Number(booking.gross_revenue);
    const currency = (dto.currency ?? booking.currency).toUpperCase().slice(0, 3);

    const request = await this.prisma.$transaction(async (tx) => {
      const created = await tx.bookingPaymentRequest.create({
        data: {
          booking_id: booking.id,
          gateway_id: gateway.id,
          status: PaymentStatus.PENDING,
          amount: new Prisma.Decimal(amount),
          currency,
          description: dto.description?.trim() || null,
          idempotency_key: idempotencyKey,
          requested_by: user.id,
          expires_at: dto.expires_at ? new Date(dto.expires_at) : null,
          metadata: dto.metadata as Prisma.InputJsonValue,
        },
        include: paymentRequestInclude,
      });

      if (
        booking.status === BookingStatus.DRAFT ||
        booking.status === BookingStatus.PAYMENT_PENDING
      ) {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: BookingStatus.PAYMENT_PENDING },
        });
      }

      return created;
    });

    await this.auditLog.log({
      action: AuditLogAction.PAYMENT_REQUEST_CREATED,
      resourceType: "booking_payment_request",
      resourceId: request.id,
      userId: user.id,
      metadata: { bookingId: booking.id, gatewayId: gateway.id, amount },
    });

    return request;
  }

  async processPaymentRequest(user: AuthenticatedUser, requestId: string) {
    if (!hasFinanceAccess(user.role)) {
      throw new BadRequestException("Only finance administrators can process payment requests");
    }

    const request = await this.prisma.bookingPaymentRequest.findUnique({
      where: { id: requestId },
      include: {
        booking: { select: { id: true, lead_id: true, status: true, lead: { select: { assigned_to: true } } } },
        gateway: true,
      },
    });

    if (!request) throw new NotFoundException("Booking payment request not found");
    if (request.status !== PaymentStatus.PENDING && request.status !== PaymentStatus.PROCESSING) {
      throw new ConflictException(`Payment request is already ${request.status.toLowerCase()}`);
    }

    const resolvedGateway = await this.gatewayRegistry.resolveGateway(request.gateway_id);

    const providerResult = await resolvedGateway.provider.createPayment(resolvedGateway.credentials, {
      amount: Number(request.amount),
      currency: request.currency,
      reference: request.idempotency_key,
      description: request.description ?? undefined,
      metadata: (request.metadata as Record<string, unknown> | null) ?? undefined,
    });

    const updatedRequest = await this.prisma.bookingPaymentRequest.update({
      where: { id: request.id },
      data: {
        status: providerResult.status,
        provider_reference: providerResult.providerReference,
        provider_checkout_url: providerResult.checkoutUrl ?? null,
        ...(providerResult.status === PaymentStatus.SUCCESS ? { completed_at: new Date() } : {}),
      },
      include: paymentRequestInclude,
    });

    const transaction = await this.transactionService.createChargeTransaction({
      bookingId: request.booking_id,
      gatewayId: request.gateway_id,
      paymentRequestId: request.id,
      amount: Number(request.amount),
      currency: request.currency,
      idempotencyKey: `txn-${request.idempotency_key}`,
      createdBy: user.id,
    });

    if (providerResult.status === PaymentStatus.SUCCESS) {
      await this.confirmBookingAfterPayment(request.booking_id, user.id);
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentStatus.SUCCESS,
          provider_reference: providerResult.providerReference,
          provider_response: providerResult.rawResponse as Prisma.InputJsonValue,
          processed_at: new Date(),
        },
      });
    } else if (providerResult.status === PaymentStatus.PROCESSING) {
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentStatus.PROCESSING,
          provider_reference: providerResult.providerReference,
          provider_response: providerResult.rawResponse as Prisma.InputJsonValue,
        },
      });
    } else if (providerResult.status === PaymentStatus.FAILED) {
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentStatus.FAILED,
          failure_reason: providerResult.failureReason ?? "Provider rejected payment",
          provider_reference: providerResult.providerReference,
          provider_response: providerResult.rawResponse as Prisma.InputJsonValue,
          processed_at: new Date(),
        },
      });
    }

    return updatedRequest;
  }

  async confirmBookingAfterPayment(bookingId: string, userId?: string) {
    const booking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CONFIRMED },
      select: {
        id: true,
        lead_id: true,
        status: true,
        gross_revenue: true,
        currency: true,
        lead: { select: { assigned_to: true } },
      },
    });

    await this.auditLog.log({
      action: AuditLogAction.BOOKING_CONFIRMED,
      resourceType: "booking",
      resourceId: booking.id,
      userId,
    });

    this.realtime.emitBookingConfirmed({
      id: booking.id,
      lead_id: booking.lead_id,
      status: booking.status,
      assigned_to: booking.lead.assigned_to,
    });

    return booking;
  }
}
