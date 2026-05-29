import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AuditLogAction,
  BookingLifecycleStatus,
  Prisma,
  RefundRequestStatus,
} from "@prisma/client";
import { randomUUID } from "crypto";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user";
import { PrismaService } from "../../prisma/prisma.service";
import { PaymentTransactionService } from "../../payments/services/payment-transaction.service";
import { AuditLogService } from "../../payments/services/audit-log.service";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { hasFinanceBookingAccess } from "../constants/booking-roles.constants";
import { BookingLifecycleService } from "./booking-lifecycle.service";

const REFUND_TRANSITIONS: Record<RefundRequestStatus, RefundRequestStatus[]> = {
  [RefundRequestStatus.REFUND_REQUESTED]: [
    RefundRequestStatus.REFUND_APPROVED,
    RefundRequestStatus.REFUND_REJECTED,
  ],
  [RefundRequestStatus.REFUND_APPROVED]: [RefundRequestStatus.REFUND_PROCESSING],
  [RefundRequestStatus.REFUND_PROCESSING]: [RefundRequestStatus.REFUNDED],
  [RefundRequestStatus.REFUNDED]: [],
  [RefundRequestStatus.REFUND_REJECTED]: [],
};

@Injectable()
export class RefundWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lifecycle: BookingLifecycleService,
    private readonly transactionService: PaymentTransactionService,
    private readonly auditLog: AuditLogService,
    private readonly realtime: RealtimeGateway,
  ) {}

  private assertRefundTransition(from: RefundRequestStatus, to: RefundRequestStatus) {
    if (from === to) return;
    if (!REFUND_TRANSITIONS[from]?.includes(to)) {
      throw new BadRequestException(`Invalid refund transition from ${from} to ${to}`);
    }
  }

  async createRefundRequest(
    user: AuthenticatedUser,
    input: {
      bookingId: string;
      transactionId?: string;
      amount: number;
      currency: string;
      reason?: string;
      idempotencyKey?: string;
    },
  ) {
    const booking = await this.prisma.booking.findUnique({ where: { id: input.bookingId } });
    if (!booking) throw new NotFoundException("Booking not found");

    const idempotencyKey = input.idempotencyKey ?? `ref-req-${randomUUID()}`;
    const existing = await this.prisma.refundRequest.findUnique({ where: { idempotency_key: idempotencyKey } });
    if (existing) return existing;

    const isPartial = Number(booking.gross_revenue) > input.amount;

    const refund = await this.prisma.refundRequest.create({
      data: {
        booking_id: input.bookingId,
        transaction_id: input.transactionId ?? null,
        amount: new Prisma.Decimal(input.amount),
        currency: input.currency.toUpperCase().slice(0, 3),
        status: RefundRequestStatus.REFUND_REQUESTED,
        is_partial: isPartial,
        reason: input.reason?.trim() || null,
        idempotency_key: idempotencyKey,
        requested_by: user.id,
      },
    });

    await this.lifecycle.transition(input.bookingId, BookingLifecycleStatus.REFUND_PENDING, {
      actorId: user.id,
      payload: { refundRequestId: refund.id },
    });

    await this.auditLog.log({
      action: AuditLogAction.REFUND_REQUESTED,
      resourceType: "refund_request",
      resourceId: refund.id,
      userId: user.id,
      metadata: { amount: input.amount, isPartial },
    });

    this.realtime.emitRefundCreated({
      id: refund.id,
      booking_id: input.bookingId,
      status: refund.status,
      amount: Number(refund.amount),
    });

    return refund;
  }

  async approveRefund(user: AuthenticatedUser, refundId: string) {
    if (!hasFinanceBookingAccess(user.role)) {
      throw new BadRequestException("Finance approval required");
    }

    const refund = await this.prisma.refundRequest.findUnique({ where: { id: refundId } });
    if (!refund) throw new NotFoundException("Refund request not found");

    this.assertRefundTransition(refund.status, RefundRequestStatus.REFUND_APPROVED);

    return this.prisma.refundRequest.update({
      where: { id: refundId },
      data: {
        status: RefundRequestStatus.REFUND_APPROVED,
        approved_by: user.id,
      },
    });
  }

  async processRefund(user: AuthenticatedUser, refundId: string) {
    if (!hasFinanceBookingAccess(user.role)) {
      throw new BadRequestException("Finance processing required");
    }

    const refund = await this.prisma.refundRequest.findUnique({ where: { id: refundId } });
    if (!refund) throw new NotFoundException("Refund request not found");

    this.assertRefundTransition(refund.status, RefundRequestStatus.REFUND_PROCESSING);

    await this.prisma.refundRequest.update({
      where: { id: refundId },
      data: { status: RefundRequestStatus.REFUND_PROCESSING },
    });

    if (refund.transaction_id) {
      await this.transactionService.refundTransaction(user, refund.transaction_id, refund.reason ?? undefined);
    }

    const completed = await this.prisma.refundRequest.update({
      where: { id: refundId },
      data: {
        status: RefundRequestStatus.REFUNDED,
        processed_at: new Date(),
      },
    });

    await this.lifecycle.transition(refund.booking_id, BookingLifecycleStatus.REFUNDED, {
      actorId: user.id,
      payload: { refundRequestId: refund.id },
    });

    await this.auditLog.log({
      action: AuditLogAction.REFUND_COMPLETED,
      resourceType: "refund_request",
      resourceId: refund.id,
      userId: user.id,
    });

    this.realtime.emitRefundCompleted({
      id: refund.id,
      booking_id: refund.booking_id,
      status: completed.status,
    });

    return completed;
  }

  async listFinanceQueue() {
    return this.prisma.refundRequest.findMany({
      where: {
        status: {
          in: [
            RefundRequestStatus.REFUND_REQUESTED,
            RefundRequestStatus.REFUND_APPROVED,
            RefundRequestStatus.REFUND_PROCESSING,
          ],
        },
      },
      orderBy: { created_at: "asc" },
      include: {
        booking: {
          select: {
            id: true,
            gross_revenue: true,
            currency: true,
            lead: { select: { customer_name: true } },
          },
        },
        requester: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
      },
    });
  }

  async openChargeback(bookingId: string, amount: number, currency: string, providerReference?: string) {
    const chargeback = await this.prisma.chargebackCase.create({
      data: {
        booking_id: bookingId,
        amount: new Prisma.Decimal(amount),
        currency,
        provider_reference: providerReference ?? null,
      },
    });

    await this.lifecycle.transition(bookingId, BookingLifecycleStatus.CHARGEBACK, {
      payload: { chargebackId: chargeback.id },
    });

    await this.auditLog.log({
      action: AuditLogAction.CHARGEBACK_OPENED,
      resourceType: "chargeback_case",
      resourceId: chargeback.id,
    });

    return chargeback;
  }
}
