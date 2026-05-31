import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import {
  AuditLogAction,
  BookingLifecycleStatus,
  BookingStatus,
  LeadStatus,
  PaymentAttemptStatus,
  PaymentGatewayType,
  PaymentSessionStatus,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user";
import { BookingLifecycleService } from "../../booking-orchestration/services/booking-lifecycle.service";
import {
  BookingOrchestrationService,
  type InitiateBookingInput,
} from "../../booking-orchestration/services/booking-orchestration.service";
import { PrismaService } from "../../prisma/prisma.service";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { hasFinanceAccess } from "../constants/payment-roles.constants";
import { AuditLogService } from "../services/audit-log.service";
import { PaymentTransactionService } from "../services/payment-transaction.service";
import { CompletePaymentSessionDto } from "./dto/complete-payment-session.dto";
import { CreatePaymentSessionDto } from "./dto/create-payment-session.dto";
import { FailPaymentSessionDto } from "./dto/fail-payment-session.dto";
import { sanitizeProviderResponse } from "./checkout/sanitize-provider-response.util";

const SESSION_TTL_HOURS = 24;

const SESSION_TRANSITIONS: Record<PaymentSessionStatus, PaymentSessionStatus[]> = {
  [PaymentSessionStatus.PENDING]: [
    PaymentSessionStatus.PROCESSING,
    PaymentSessionStatus.CANCELLED,
    PaymentSessionStatus.EXPIRED,
  ],
  [PaymentSessionStatus.PROCESSING]: [
    PaymentSessionStatus.SUCCESS,
    PaymentSessionStatus.FAILED,
    PaymentSessionStatus.CANCELLED,
  ],
  [PaymentSessionStatus.SUCCESS]: [],
  [PaymentSessionStatus.FAILED]: [],
  [PaymentSessionStatus.CANCELLED]: [],
  [PaymentSessionStatus.EXPIRED]: [],
};

const sessionInclude = {
  lead: {
    select: {
      id: true,
      customer_name: true,
      customer_email: true,
      customer_phone: true,
      pickup_location: true,
      drop_location: true,
      pickup_datetime: true,
      return_datetime: true,
      assigned_to: true,
      is_recurring_customer: true,
      customer_lifetime_value: true,
      assigned_agent: { select: { id: true, name: true, email: true } },
      traveler: {
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          is_recurring: true,
          booking_count: true,
          lifetime_value: true,
        },
      },
    },
  },
  booking: {
    select: {
      id: true,
      gross_revenue: true,
      currency: true,
      lifecycle_status: true,
      status: true,
      vehicle: { select: { id: true, make: true, model: true, vehicle_class: true } },
    },
  },
  gateway: { select: { id: true, name: true, type: true, is_active: true } },
  requested_by: { select: { id: true, name: true, email: true, role: true } },
  processed_by: { select: { id: true, name: true, email: true, role: true } },
  attempts: {
    orderBy: { created_at: "desc" as const },
    include: {
      initiated_by: { select: { id: true, name: true, email: true } },
      gateway: { select: { id: true, name: true, type: true } },
    },
  },
} satisfies Prisma.PaymentSessionInclude;

type SessionWithRelations = Prisma.PaymentSessionGetPayload<{ include: typeof sessionInclude }>;

type RequestContext = {
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;
};

@Injectable()
export class PaymentSessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly realtime: RealtimeGateway,
    private readonly lifecycle: BookingLifecycleService,
    private readonly paymentTransactions: PaymentTransactionService,
    @Inject(forwardRef(() => BookingOrchestrationService))
    private readonly bookingOrchestration: BookingOrchestrationService,
  ) {}

  private sessionAccessWhere(user: AuthenticatedUser): Prisma.PaymentSessionWhereInput {
    if (hasFinanceAccess(user.role)) return {};
    return { requested_by_id: user.id };
  }

  private assertSessionTransition(from: PaymentSessionStatus, to: PaymentSessionStatus) {
    if (from === to) return;
    const allowed = SESSION_TRANSITIONS[from];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Invalid payment session transition from ${from} to ${to}`,
      );
    }
  }

  private async expireStaleSessions() {
    await this.prisma.paymentSession.updateMany({
      where: {
        status: PaymentSessionStatus.PENDING,
        expires_at: { lt: new Date() },
      },
      data: { status: PaymentSessionStatus.EXPIRED },
    });
  }

  buildQueueItem(session: SessionWithRelations) {
    return {
      id: session.id,
      customer_name: session.lead.customer_name,
      booking_id: session.booking_id,
      lead_id: session.lead_id,
      amount: Number(session.amount),
      currency: session.currency,
      agent_name: session.requested_by.name,
      gateway_name: session.gateway.name,
      gateway_type: session.gateway.type,
      status: session.status,
      created_at: session.created_at,
      expires_at: session.expires_at,
      checkout_path: `/app/checkout-console/${session.id}`,
    };
  }

  private toQueueItem(session: SessionWithRelations) {
    return this.buildQueueItem(session);
  }

  private notifyFinanceQueue(session: SessionWithRelations) {
    const queueItem = this.buildQueueItem(session);
    this.realtime.emitFinancePaymentQueued({
      id: session.id,
      booking_id: session.booking_id,
      lead_id: session.lead_id,
      assigned_to: session.lead.assigned_to,
      status: session.status,
      amount: queueItem.amount,
      currency: session.currency,
      gateway_id: session.gateway_id,
      gateway_name: session.gateway.name,
      requested_by_id: session.requested_by_id,
      processed_by_id: session.processed_by_id,
      customer_name: queueItem.customer_name,
      agent_name: queueItem.agent_name,
      checkout_path: queueItem.checkout_path,
      created_at: session.created_at.toISOString(),
    });
  }

  private emitSessionEvent(
    eventName:
      | "PAYMENT_SESSION_CREATED"
      | "PAYMENT_SESSION_PROCESSING"
      | "PAYMENT_SESSION_SUCCESS"
      | "PAYMENT_SESSION_FAILED"
      | "PAYMENT_SESSION_CANCELLED",
    session: SessionWithRelations,
  ) {
    this.realtime.emitPaymentSessionEvent(eventName, {
      id: session.id,
      booking_id: session.booking_id,
      lead_id: session.lead_id,
      assigned_to: session.lead.assigned_to,
      status: session.status,
      amount: Number(session.amount),
      currency: session.currency,
      gateway_id: session.gateway_id,
      gateway_name: session.gateway.name,
      requested_by_id: session.requested_by_id,
      processed_by_id: session.processed_by_id,
    });
  }

  async create(user: AuthenticatedUser, dto: CreatePaymentSessionDto, ctx: RequestContext = {}) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.booking_id },
      include: {
        lead: { select: { id: true, assigned_to: true } },
      },
    });

    if (!booking) throw new NotFoundException("Booking not found");

    if (!hasFinanceAccess(user.role) && booking.lead.assigned_to !== user.id) {
      throw new BadRequestException("You can only create payment sessions for your assigned bookings");
    }

    const gateway = await this.prisma.paymentGateway.findUnique({
      where: { id: dto.gateway_id },
    });
    if (!gateway || !gateway.is_active) {
      throw new BadRequestException("Payment gateway is unavailable");
    }

    const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

    const session = await this.prisma.paymentSession.create({
      data: {
        lead_id: booking.lead_id,
        booking_id: booking.id,
        amount: new Prisma.Decimal(dto.amount),
        currency: dto.currency.toUpperCase().slice(0, 3),
        gateway_id: dto.gateway_id,
        requested_by_id: user.id,
        status: PaymentSessionStatus.PENDING,
        finance_notes: dto.finance_notes ?? null,
        expires_at: expiresAt,
      },
      include: sessionInclude,
    });

    await this.auditLog.log({
      action: AuditLogAction.PAYMENT_SESSION_CREATED,
      resourceType: "payment_session",
      resourceId: session.id,
      userId: user.id,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      requestMethod: ctx.requestMethod,
      requestPath: ctx.requestPath,
      metadata: {
        bookingId: booking.id,
        gatewayId: dto.gateway_id,
        amount: dto.amount,
        currency: dto.currency,
      },
    });

    this.notifyFinanceQueue(session);
    return session;
  }

  async requestPaymentForLead(
    user: AuthenticatedUser,
    input: InitiateBookingInput & { financeNotes?: string },
    ctx: RequestContext = {},
  ) {
    const payableStatuses: BookingLifecycleStatus[] = [
      BookingLifecycleStatus.BOOKING_REQUESTED,
      BookingLifecycleStatus.PAYMENT_PENDING,
      BookingLifecycleStatus.PAYMENT_FAILED,
    ];

    let booking = await this.prisma.booking.findFirst({
      where: {
        lead_id: input.leadId,
        lifecycle_status: { in: payableStatuses },
      },
      orderBy: { created_at: "desc" },
    });

    if (!booking) {
      booking = await this.bookingOrchestration.initiateFromLead(user, input);
    }

    const session = await this.requestPaymentForBooking(user, booking.id, ctx, {
      finance_notes: input.financeNotes,
    });

    return this.wrapPaymentRequestResult(session, booking);
  }

  async requestPaymentForBooking(
    user: AuthenticatedUser,
    bookingId: string,
    ctx: RequestContext = {},
    options?: { finance_notes?: string },
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        lead: { select: { id: true, assigned_to: true } },
      },
    });

    if (!booking) throw new NotFoundException("Booking not found");

    if (!hasFinanceAccess(user.role) && booking.lead.assigned_to !== user.id) {
      throw new BadRequestException("You can only request payment for your assigned bookings");
    }

    const payableStatuses: BookingLifecycleStatus[] = [
      BookingLifecycleStatus.BOOKING_REQUESTED,
      BookingLifecycleStatus.PAYMENT_PENDING,
      BookingLifecycleStatus.PAYMENT_FAILED,
    ];

    if (!payableStatuses.includes(booking.lifecycle_status)) {
      throw new BadRequestException(
        `Booking is not awaiting payment (status: ${booking.lifecycle_status})`,
      );
    }

    const openSession = await this.prisma.paymentSession.findFirst({
      where: {
        booking_id: bookingId,
        status: {
          in: [PaymentSessionStatus.PENDING, PaymentSessionStatus.PROCESSING],
        },
      },
      include: sessionInclude,
    });

    if (openSession) {
      this.notifyFinanceQueue(openSession);
      return openSession;
    }

    const gateway = await this.prisma.paymentGateway.findFirst({
      where: { is_active: true, type: PaymentGatewayType.paypal },
      orderBy: { created_at: "asc" },
    });

    if (!gateway) {
      throw new BadRequestException("No active PayPal gateway configured for assisted checkout");
    }

    const amount = Number(booking.gross_revenue);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException("Booking amount must be greater than zero");
    }

    if (booking.lifecycle_status === BookingLifecycleStatus.BOOKING_REQUESTED) {
      await this.lifecycle.transition(bookingId, BookingLifecycleStatus.PAYMENT_PENDING, {
        actorId: user.id,
        ipAddress: ctx.ipAddress,
      });
    }

    const session = await this.create(
      user,
      {
        booking_id: bookingId,
        gateway_id: gateway.id,
        amount,
        currency: booking.currency,
        finance_notes: options?.finance_notes,
      },
      ctx,
    );

    await this.auditLog.log({
      action: AuditLogAction.PAYMENT_REQUEST_CREATED,
      resourceType: "lead",
      resourceId: session.lead_id,
      userId: user.id,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      requestMethod: ctx.requestMethod,
      requestPath: ctx.requestPath,
      metadata: {
        bookingId,
        paymentSessionId: session.id,
        amount: Number(session.amount),
        currency: session.currency,
        gatewayId: session.gateway_id,
      },
    });

    return session;
  }

  wrapPaymentRequestResult(session: SessionWithRelations, booking: {
    id: string;
    lead_id: string;
    gross_revenue: unknown;
    currency: string;
    lifecycle_status: BookingLifecycleStatus;
    status: BookingStatus;
  }) {
    const queueItem = this.buildQueueItem(session);
    return {
      booking: {
        id: booking.id,
        lead_id: booking.lead_id,
        gross_revenue: Number(booking.gross_revenue),
        currency: booking.currency,
        lifecycle_status: booking.lifecycle_status,
        status: booking.status,
      },
      session,
      queue_item: queueItem,
      checkout_path: queueItem.checkout_path,
    };
  }

  async getQueue(user: AuthenticatedUser) {
    if (!hasFinanceAccess(user.role)) {
      throw new BadRequestException("Only finance administrators can view the payment queue");
    }

    await this.expireStaleSessions();

    const sessions = await this.prisma.paymentSession.findMany({
      where: {
        status: {
          in: [
            PaymentSessionStatus.PENDING,
            PaymentSessionStatus.PROCESSING,
            PaymentSessionStatus.FAILED,
          ],
        },
      },
      include: sessionInclude,
      orderBy: [{ status: "asc" }, { created_at: "asc" }],
      take: 200,
    });

    return sessions.map((session) => this.toQueueItem(session));
  }

  async getMetrics(user: AuthenticatedUser) {
    if (!hasFinanceAccess(user.role)) {
      throw new BadRequestException("Only finance administrators can view finance metrics");
    }

    await this.expireStaleSessions();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);

    const [pending, processing, successToday, failedToday, revenueTodayAgg, revenueMonthAgg] =
      await Promise.all([
        this.prisma.paymentSession.count({ where: { status: PaymentSessionStatus.PENDING } }),
        this.prisma.paymentSession.count({ where: { status: PaymentSessionStatus.PROCESSING } }),
        this.prisma.paymentSession.count({
          where: { status: PaymentSessionStatus.SUCCESS, updated_at: { gte: startOfDay } },
        }),
        this.prisma.paymentSession.count({
          where: { status: PaymentSessionStatus.FAILED, updated_at: { gte: startOfDay } },
        }),
        this.prisma.paymentSession.aggregate({
          where: { status: PaymentSessionStatus.SUCCESS, updated_at: { gte: startOfDay } },
          _sum: { amount: true },
        }),
        this.prisma.paymentSession.aggregate({
          where: { status: PaymentSessionStatus.SUCCESS, updated_at: { gte: startOfMonth } },
          _sum: { amount: true },
        }),
      ]);

    return {
      pending_payments: pending,
      processing,
      successful_today: successToday,
      failed_today: failedToday,
      revenue_today: Number(revenueTodayAgg._sum.amount ?? 0),
      revenue_this_month: Number(revenueMonthAgg._sum.amount ?? 0),
    };
  }

  async getById(user: AuthenticatedUser, sessionId: string, ctx: RequestContext = {}) {
    await this.expireStaleSessions();

    const session = await this.prisma.paymentSession.findFirst({
      where: { id: sessionId, ...this.sessionAccessWhere(user) },
      include: sessionInclude,
    });

    if (!session) throw new NotFoundException("Payment session not found");

    if (hasFinanceAccess(user.role)) {
      await this.auditLog.log({
        action: AuditLogAction.PAYMENT_SESSION_OPENED,
        resourceType: "payment_session",
        resourceId: session.id,
        userId: user.id,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        requestMethod: ctx.requestMethod,
        requestPath: ctx.requestPath,
        metadata: { gatewayId: session.gateway_id },
      });
    }

    return session;
  }

  async start(user: AuthenticatedUser, sessionId: string, ctx: RequestContext = {}) {
    if (!hasFinanceAccess(user.role)) {
      throw new BadRequestException("Only finance administrators can start payment sessions");
    }

    const session = await this.getSessionOrThrow(sessionId);
    this.assertNotExpired(session);
    this.assertSessionTransition(session.status, PaymentSessionStatus.PROCESSING);

    const updated = await this.prisma.paymentSession.update({
      where: { id: sessionId },
      data: {
        status: PaymentSessionStatus.PROCESSING,
        processed_by_id: user.id,
      },
      include: sessionInclude,
    });

    if (
      updated.booking.lifecycle_status === BookingLifecycleStatus.PAYMENT_PENDING ||
      updated.booking.lifecycle_status === BookingLifecycleStatus.BOOKING_REQUESTED
    ) {
      await this.lifecycle.transition(updated.booking_id, BookingLifecycleStatus.PAYMENT_PROCESSING, {
        actorId: user.id,
        ipAddress: ctx.ipAddress,
      });
    }

    await this.auditLog.log({
      action: AuditLogAction.PAYMENT_SESSION_PROCESSING,
      resourceType: "payment_session",
      resourceId: sessionId,
      userId: user.id,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      requestMethod: ctx.requestMethod,
      requestPath: ctx.requestPath,
      metadata: {
        gatewayId: updated.gateway_id,
        gatewayName: updated.gateway.name,
        financeUserId: user.id,
      },
    });

    this.emitSessionEvent("PAYMENT_SESSION_PROCESSING", updated);
    return updated;
  }

  async complete(
    user: AuthenticatedUser,
    sessionId: string,
    dto: CompletePaymentSessionDto = {},
    ctx: RequestContext = {},
  ) {
    if (!hasFinanceAccess(user.role)) {
      throw new BadRequestException("Only finance administrators can complete payment sessions");
    }

    const session = await this.getSessionOrThrow(sessionId);
    this.assertNotExpired(session);
    this.assertSessionTransition(session.status, PaymentSessionStatus.SUCCESS);

    return this.finalizeSuccessfulCheckout(
      session,
      user,
      {
        providerReference: dto.provider_reference ?? `admin-session-${session.id.slice(0, 8)}`,
        financeNotes: dto.finance_notes,
      },
      ctx,
    );
  }

  async finalizeSuccessfulCheckout(
    session: SessionWithRelations,
    user: AuthenticatedUser,
    input: {
      providerReference: string;
      providerResponse?: unknown;
      financeNotes?: string | null;
      attemptId?: string;
      captureId?: string;
    },
    ctx: RequestContext = {},
  ) {
    this.assertSessionTransition(session.status, PaymentSessionStatus.SUCCESS);

    const transaction = await this.paymentTransactions.createChargeTransaction({
      bookingId: session.booking_id,
      gatewayId: session.gateway_id,
      paymentSessionId: session.id,
      amount: Number(session.amount),
      currency: session.currency,
      idempotencyKey: `payment-session-${session.id}`,
      createdBy: user.id,
    });

    await this.prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: PaymentStatus.SUCCESS,
        provider_reference: input.providerReference,
        provider_response: input.providerResponse
          ? (input.providerResponse as Prisma.InputJsonValue)
          : undefined,
        processed_at: new Date(),
      },
    });

    if (input.attemptId) {
      await this.prisma.paymentSessionAttempt.update({
        where: { id: input.attemptId },
        data: {
          status: PaymentAttemptStatus.CAPTURED,
          provider_capture_id: input.captureId ?? input.providerReference,
          provider_response: input.providerResponse
            ? (sanitizeProviderResponse(input.providerResponse) as Prisma.InputJsonValue)
            : undefined,
        },
      });
    }

    const updated = await this.prisma.paymentSession.update({
      where: { id: session.id },
      data: {
        status: PaymentSessionStatus.SUCCESS,
        processed_by_id: user.id,
        finance_notes: input.financeNotes ?? session.finance_notes,
        provider_order_id: session.provider_order_id,
      },
      include: sessionInclude,
    });

    await this.auditLog.log({
      action: AuditLogAction.PAYMENT_SESSION_SUCCESS,
      resourceType: "payment_session",
      resourceId: session.id,
      userId: user.id,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      requestMethod: ctx.requestMethod,
      requestPath: ctx.requestPath,
      metadata: {
        transactionId: transaction.id,
        gatewayId: updated.gateway_id,
        gatewayName: updated.gateway.name,
        financeUserId: user.id,
        providerReference: input.providerReference,
        captureId: input.captureId,
      },
    });

    await this.auditLog.log({
      action: AuditLogAction.PAYMENT_SUCCESS,
      resourceType: "payment_transaction",
      resourceId: transaction.id,
      userId: user.id,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      requestMethod: ctx.requestMethod,
      requestPath: ctx.requestPath,
      metadata: {
        bookingId: updated.booking_id,
        paymentSessionId: session.id,
        amount: Number(updated.amount),
        currency: updated.currency,
      },
    });

    this.realtime.emitPaymentSuccess({
      id: transaction.id,
      booking_id: updated.booking_id,
      lead_id: updated.lead_id,
      assigned_to: updated.lead.assigned_to,
      status: PaymentStatus.SUCCESS,
      amount: Number(updated.amount),
      currency: updated.currency,
      gateway_type: updated.gateway.type,
    });

    this.emitSessionEvent("PAYMENT_SESSION_SUCCESS", updated);

    try {
      await this.bookingOrchestration.onPaymentSuccess(updated.booking_id, user.id);

      const booking = await this.lifecycle.getBookingOrThrow(updated.booking_id);
      if (booking.lifecycle_status === BookingLifecycleStatus.SUPPLIER_BOOKING_PENDING) {
        await this.lifecycle.transition(updated.booking_id, BookingLifecycleStatus.BOOKING_CONFIRMED, {
          actorId: user.id,
          ipAddress: ctx.ipAddress,
          payload: { source: "payment_session_checkout" },
        });
      }
    } catch (error) {
      await this.auditLog.log({
        action: AuditLogAction.BOOKING_LIFECYCLE_TRANSITION,
        resourceType: "booking",
        resourceId: updated.booking_id,
        userId: user.id,
        metadata: {
          warning: "post_session_orchestration_failed",
          message: error instanceof Error ? error.message : String(error),
        },
      });
    }

    await this.syncLeadAfterConversion(updated);

    return updated;
  }

  async getSessionForFinance(sessionId: string) {
    return this.getSessionOrThrow(sessionId);
  }

  async fail(
    user: AuthenticatedUser,
    sessionId: string,
    dto: FailPaymentSessionDto,
    ctx: RequestContext = {},
  ) {
    if (!hasFinanceAccess(user.role)) {
      throw new BadRequestException("Only finance administrators can fail payment sessions");
    }

    const session = await this.getSessionOrThrow(sessionId);
    this.assertSessionTransition(session.status, PaymentSessionStatus.FAILED);

    const updated = await this.prisma.paymentSession.update({
      where: { id: sessionId },
      data: {
        status: PaymentSessionStatus.FAILED,
        processed_by_id: user.id,
        failure_reason: dto.failure_reason,
        finance_notes: dto.finance_notes ?? session.finance_notes,
      },
      include: sessionInclude,
    });

    if (updated.booking.lifecycle_status === BookingLifecycleStatus.PAYMENT_PROCESSING) {
      await this.lifecycle.transition(updated.booking_id, BookingLifecycleStatus.PAYMENT_FAILED, {
        actorId: user.id,
        ipAddress: ctx.ipAddress,
        payload: { reason: dto.failure_reason },
      });
    }

    await this.auditLog.log({
      action: AuditLogAction.PAYMENT_SESSION_FAILURE,
      resourceType: "payment_session",
      resourceId: sessionId,
      userId: user.id,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      requestMethod: ctx.requestMethod,
      requestPath: ctx.requestPath,
      metadata: {
        failureReason: dto.failure_reason,
        gatewayId: updated.gateway_id,
        financeUserId: user.id,
      },
    });

    this.emitSessionEvent("PAYMENT_SESSION_FAILED", updated);
    return updated;
  }

  async cancel(user: AuthenticatedUser, sessionId: string, ctx: RequestContext = {}) {
    const session = await this.getSessionOrThrow(sessionId);

    if (!hasFinanceAccess(user.role) && session.requested_by_id !== user.id) {
      throw new BadRequestException("You cannot cancel this payment session");
    }

    this.assertSessionTransition(session.status, PaymentSessionStatus.CANCELLED);

    const updated = await this.prisma.paymentSession.update({
      where: { id: sessionId },
      data: { status: PaymentSessionStatus.CANCELLED },
      include: sessionInclude,
    });

    await this.auditLog.log({
      action: AuditLogAction.PAYMENT_SESSION_CANCELLED,
      resourceType: "payment_session",
      resourceId: sessionId,
      userId: user.id,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      requestMethod: ctx.requestMethod,
      requestPath: ctx.requestPath,
    });

    this.emitSessionEvent("PAYMENT_SESSION_CANCELLED", updated);
    return updated;
  }

  async listSessionAudit(sessionId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        resource_type: "payment_session",
        resource_id: sessionId,
      },
      orderBy: { created_at: "asc" },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  private async getSessionOrThrow(sessionId: string) {
    const session = await this.prisma.paymentSession.findUnique({
      where: { id: sessionId },
      include: sessionInclude,
    });
    if (!session) throw new NotFoundException("Payment session not found");
    return session;
  }

  private assertNotExpired(session: { status: PaymentSessionStatus; expires_at: Date }) {
    if (session.status !== PaymentSessionStatus.PENDING) return;
    if (session.expires_at < new Date()) {
      throw new BadRequestException("Payment session has expired");
    }
  }

  private async syncLeadAfterConversion(session: SessionWithRelations) {
    const traveler = session.lead.traveler;
    const successfulBookings = traveler
      ? traveler.booking_count + 1
      : await this.prisma.booking.count({
          where: {
            lead_id: session.lead_id,
            lifecycle_status: {
              in: [
                BookingLifecycleStatus.BOOKING_CONFIRMED,
                BookingLifecycleStatus.COMPLETED,
                BookingLifecycleStatus.VOUCHER_GENERATED,
                BookingLifecycleStatus.CUSTOMER_NOTIFIED,
              ],
            },
          },
        });

    const isRecurring = successfulBookings >= 2;
    const lifetimeValue =
      Number(session.lead.customer_lifetime_value ?? 0) + Number(session.amount);

    await this.prisma.lead.update({
      where: { id: session.lead_id },
      data: {
        status: LeadStatus.CONFIRMED,
        is_recurring_customer: isRecurring,
        customer_lifetime_value: new Prisma.Decimal(lifetimeValue),
      },
    });

    if (traveler && isRecurring) {
      await this.prisma.traveler.update({
        where: { id: traveler.id },
        data: { is_recurring: true },
      });
    }
  }
}
