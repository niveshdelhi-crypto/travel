import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import {
  AuditLogAction,
  PaymentStatus,
  Prisma,
  TransactionType,
  UserRole,
} from "@prisma/client";
import { randomUUID } from "crypto";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user";
import { PrismaService } from "../../prisma/prisma.service";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { hasFinanceAccess } from "../constants/payment-roles.constants";
import { GatewayRegistryService } from "./gateway-registry.service";
import { AuditLogService } from "./audit-log.service";
import { BookingOrchestrationService } from "../../booking-orchestration/services/booking-orchestration.service";

const VALID_STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.PENDING]: [PaymentStatus.PROCESSING, PaymentStatus.FAILED],
  [PaymentStatus.PROCESSING]: [PaymentStatus.SUCCESS, PaymentStatus.FAILED],
  [PaymentStatus.SUCCESS]: [PaymentStatus.REFUNDED],
  [PaymentStatus.FAILED]: [],
  [PaymentStatus.REFUNDED]: [],
};

const transactionListInclude = {
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
  gateway: { select: { id: true, name: true, type: true } },
  payment_request: { select: { id: true, idempotency_key: true } },
  creator: { select: { id: true, name: true, email: true } },
} satisfies Prisma.PaymentTransactionInclude;

@Injectable()
export class PaymentTransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gatewayRegistry: GatewayRegistryService,
    private readonly auditLog: AuditLogService,
    private readonly realtime: RealtimeGateway,
    @Inject(forwardRef(() => BookingOrchestrationService))
    private readonly bookingOrchestration: BookingOrchestrationService,
  ) {}

  private transactionAccessWhere(user: AuthenticatedUser): Prisma.PaymentTransactionWhereInput {
    if (hasFinanceAccess(user.role)) return {};
    return { booking: { lead: { assigned_to: user.id } } };
  }

  assertStatusTransition(current: PaymentStatus, next: PaymentStatus) {
    if (current === next) return;
    const allowed = VALID_STATUS_TRANSITIONS[current];
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Invalid payment status transition from ${current} to ${next}`,
      );
    }
  }

  async listTransactions(user: AuthenticatedUser, page = 1, pageSize = 25, status?: PaymentStatus) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(100, Math.max(10, pageSize));
    const skip = (safePage - 1) * safePageSize;

    const where: Prisma.PaymentTransactionWhereInput = {
      ...this.transactionAccessWhere(user),
      ...(status ? { status } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.paymentTransaction.findMany({
        where,
        include: transactionListInclude,
        orderBy: { created_at: "desc" },
        skip,
        take: safePageSize,
      }),
      this.prisma.paymentTransaction.count({ where }),
    ]);

    return {
      data,
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    };
  }

  async getTransaction(user: AuthenticatedUser, transactionId: string) {
    const transaction = await this.prisma.paymentTransaction.findFirst({
      where: { id: transactionId, ...this.transactionAccessWhere(user) },
      include: transactionListInclude,
    });

    if (!transaction) throw new NotFoundException("Payment transaction not found");
    return transaction;
  }

  async createChargeTransaction(input: {
    bookingId: string;
    gatewayId: string;
    paymentRequestId?: string;
    paymentSessionId?: string;
    amount: number;
    currency: string;
    idempotencyKey?: string;
    createdBy?: string;
  }) {
    const idempotencyKey = input.idempotencyKey ?? `txn-charge-${randomUUID()}`;

    const existing = await this.prisma.paymentTransaction.findUnique({
      where: { idempotency_key: idempotencyKey },
    });
    if (existing) return existing;

    const transaction = await this.prisma.paymentTransaction.create({
      data: {
        booking_id: input.bookingId,
        gateway_id: input.gatewayId,
        payment_request_id: input.paymentRequestId ?? null,
        payment_session_id: input.paymentSessionId ?? null,
        type: TransactionType.CHARGE,
        status: PaymentStatus.PENDING,
        amount: new Prisma.Decimal(input.amount),
        currency: input.currency.toUpperCase().slice(0, 3),
        idempotency_key: idempotencyKey,
        created_by: input.createdBy ?? null,
      },
      include: transactionListInclude,
    });

    this.realtime.emitPaymentCreated({
      id: transaction.id,
      booking_id: transaction.booking_id,
      lead_id: transaction.booking.lead_id,
      assigned_to: transaction.booking.lead.assigned_to,
      status: transaction.status,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      gateway_type: transaction.gateway.type,
    });

    return transaction;
  }

  async processTransaction(user: AuthenticatedUser, transactionId: string) {
    if (!hasFinanceAccess(user.role)) {
      throw new BadRequestException("Only finance administrators can process payments");
    }

    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: {
        booking: { select: { id: true, lead_id: true, lead: { select: { assigned_to: true } } } },
        gateway: true,
        payment_request: true,
      },
    });

    if (!transaction) throw new NotFoundException("Payment transaction not found");
    this.assertStatusTransition(transaction.status, PaymentStatus.PROCESSING);

    const resolvedGateway = await this.gatewayRegistry.resolveGateway(transaction.gateway_id);
    if (!resolvedGateway.isActive) {
      throw new BadRequestException("Payment gateway is inactive");
    }

    await this.transitionStatus(transaction.id, PaymentStatus.PROCESSING, {
      auditAction: AuditLogAction.PAYMENT_PROCESSING,
      userId: user.id,
    });

    const providerResult = await resolvedGateway.provider.createPayment(resolvedGateway.credentials, {
      amount: Number(transaction.amount),
      currency: transaction.currency,
      reference: transaction.idempotency_key,
      description: transaction.payment_request?.description ?? undefined,
      metadata: {
        bookingId: transaction.booking_id,
        transactionId: transaction.id,
      },
    });

    if (providerResult.status === PaymentStatus.SUCCESS) {
      return this.completeSuccessfulTransaction(transaction, providerResult, user.id);
    }

    if (providerResult.status === PaymentStatus.PROCESSING) {
      return this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          provider_reference: providerResult.providerReference,
          provider_response: providerResult.rawResponse as Prisma.InputJsonValue,
        },
        include: transactionListInclude,
      });
    }

    return this.failTransaction(transaction.id, providerResult.failureReason ?? "Provider rejected payment", {
      providerReference: providerResult.providerReference,
      rawResponse: providerResult.rawResponse,
      userId: user.id,
    });
  }

  async captureTransaction(user: AuthenticatedUser, transactionId: string) {
    if (!hasFinanceAccess(user.role)) {
      throw new BadRequestException("Only finance administrators can capture payments");
    }

    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: {
        booking: { select: { id: true, lead_id: true, lead: { select: { assigned_to: true } } } },
      },
    });

    if (!transaction) throw new NotFoundException("Payment transaction not found");
    if (!transaction.provider_reference) {
      throw new BadRequestException("Transaction has no provider reference to capture");
    }

    this.assertStatusTransition(transaction.status, PaymentStatus.PROCESSING);

    const resolvedGateway = await this.gatewayRegistry.resolveGateway(transaction.gateway_id);
    await this.transitionStatus(transaction.id, PaymentStatus.PROCESSING, {
      auditAction: AuditLogAction.PAYMENT_PROCESSING,
      userId: user.id,
    });

    const providerResult = await resolvedGateway.provider.capturePayment(
      resolvedGateway.credentials,
      transaction.provider_reference,
    );

    if (providerResult.status === PaymentStatus.SUCCESS) {
      return this.completeSuccessfulTransaction(transaction, providerResult, user.id);
    }

    return this.failTransaction(transaction.id, providerResult.failureReason ?? "Capture failed", {
      providerReference: providerResult.providerReference,
      rawResponse: providerResult.rawResponse,
      userId: user.id,
    });
  }

  async refundTransaction(user: AuthenticatedUser, transactionId: string, reason?: string) {
    if (!hasFinanceAccess(user.role)) {
      throw new BadRequestException("Only finance administrators can refund payments");
    }

    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) throw new NotFoundException("Payment transaction not found");
    this.assertStatusTransition(transaction.status, PaymentStatus.REFUNDED);

    if (!transaction.provider_reference) {
      throw new BadRequestException("Transaction has no provider reference to refund");
    }

    const resolvedGateway = await this.gatewayRegistry.resolveGateway(transaction.gateway_id);
    const providerResult = await resolvedGateway.provider.refundPayment(resolvedGateway.credentials, {
      providerReference: transaction.provider_reference,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      reason,
    });

    if (providerResult.status !== PaymentStatus.REFUNDED) {
      throw new BadRequestException(providerResult.failureReason ?? "Refund failed");
    }

    const refundTransaction = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentStatus.REFUNDED,
          processed_at: new Date(),
          provider_response: providerResult.rawResponse as Prisma.InputJsonValue,
        },
        include: transactionListInclude,
      });

      await tx.paymentTransaction.create({
        data: {
          booking_id: transaction.booking_id,
          gateway_id: transaction.gateway_id,
          payment_request_id: transaction.payment_request_id,
          type: TransactionType.REFUND,
          status: PaymentStatus.REFUNDED,
          amount: transaction.amount,
          currency: transaction.currency,
          provider_reference: providerResult.providerReference,
          provider_response: providerResult.rawResponse as Prisma.InputJsonValue,
          idempotency_key: `refund-${transaction.idempotency_key}`,
          created_by: user.id,
          processed_at: new Date(),
        },
      });

      return updated;
    });

    await this.auditLog.log({
      action: AuditLogAction.PAYMENT_REFUNDED,
      resourceType: "payment_transaction",
      resourceId: transaction.id,
      userId: user.id,
      metadata: { reason },
    });

    return refundTransaction;
  }

  private async transitionStatus(
    transactionId: string,
    nextStatus: PaymentStatus,
    options?: { auditAction?: AuditLogAction; userId?: string },
  ) {
    const current = await this.prisma.paymentTransaction.findUnique({ where: { id: transactionId } });
    if (!current) throw new NotFoundException("Payment transaction not found");

    this.assertStatusTransition(current.status, nextStatus);

    const updated = await this.prisma.paymentTransaction.update({
      where: { id: transactionId },
      data: {
        status: nextStatus,
        ...(nextStatus === PaymentStatus.SUCCESS || nextStatus === PaymentStatus.FAILED
          ? { processed_at: new Date() }
          : {}),
      },
      include: transactionListInclude,
    });

    if (options?.auditAction) {
      await this.auditLog.log({
        action: options.auditAction,
        resourceType: "payment_transaction",
        resourceId: transactionId,
        userId: options.userId,
        metadata: { status: nextStatus },
      });
    }

    return updated;
  }

  private async completeSuccessfulTransaction(
    transaction: {
      id: string;
      booking_id: string;
      booking: { id: string; lead_id: string; lead: { assigned_to: string | null } };
    },
    providerResult: { providerReference: string; rawResponse?: unknown },
    userId: string,
  ) {
    const updated = await this.prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: PaymentStatus.SUCCESS,
        provider_reference: providerResult.providerReference,
        provider_response: providerResult.rawResponse as Prisma.InputJsonValue,
        processed_at: new Date(),
      },
      include: transactionListInclude,
    });

    await this.auditLog.log({
      action: AuditLogAction.PAYMENT_SUCCESS,
      resourceType: "payment_transaction",
      resourceId: transaction.id,
      userId,
    });

    this.realtime.emitPaymentSuccess({
      id: updated.id,
      booking_id: updated.booking_id,
      lead_id: updated.booking.lead_id,
      assigned_to: updated.booking.lead.assigned_to,
      status: updated.status,
      amount: Number(updated.amount),
      currency: updated.currency,
    });

    try {
      await this.bookingOrchestration.onPaymentSuccess(transaction.booking_id, userId);
    } catch (error) {
      // Payment succeeded at provider — log orchestration follow-up failure without reversing txn
      await this.auditLog.log({
        action: AuditLogAction.BOOKING_LIFECYCLE_TRANSITION,
        resourceType: "booking",
        resourceId: transaction.booking_id,
        userId,
        metadata: {
          warning: "post_payment_orchestration_failed",
          message: error instanceof Error ? error.message : String(error),
        },
      });
    }

    return updated;
  }

  private async failTransaction(
    transactionId: string,
    failureReason: string,
    options: { providerReference?: string; rawResponse?: unknown; userId?: string },
  ) {
    const updated = await this.prisma.paymentTransaction.update({
      where: { id: transactionId },
      data: {
        status: PaymentStatus.FAILED,
        failure_reason: failureReason,
        provider_reference: options.providerReference ?? undefined,
        provider_response: options.rawResponse as Prisma.InputJsonValue,
        processed_at: new Date(),
      },
      include: transactionListInclude,
    });

    await this.auditLog.log({
      action: AuditLogAction.PAYMENT_FAILED,
      resourceType: "payment_transaction",
      resourceId: transactionId,
      userId: options.userId,
      metadata: { failureReason },
    });

    this.realtime.emitPaymentFailed({
      id: updated.id,
      booking_id: updated.booking_id,
      lead_id: updated.booking.lead_id,
      assigned_to: updated.booking.lead.assigned_to,
      status: updated.status,
      failure_reason: failureReason,
    });

    return updated;
  }
}
