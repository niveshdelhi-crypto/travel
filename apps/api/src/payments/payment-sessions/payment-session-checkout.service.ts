import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AuditLogAction,
  PaymentAttemptStatus,
  PaymentGatewayType,
  PaymentSessionStatus,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user";
import { PrismaService } from "../../prisma/prisma.service";
import { hasFinanceAccess } from "../constants/payment-roles.constants";
import { AuditLogService } from "../services/audit-log.service";
import { GatewayHealthService } from "../services/gateway-health.service";
import { CheckoutGatewayRegistry } from "./checkout/checkout-gateway.registry";
import { extractPaypalCaptureId } from "../utils/paypal-payload.util";
import { sanitizeProviderResponse } from "./checkout/sanitize-provider-response.util";
import { CaptureCheckoutOrderDto } from "./dto/capture-checkout-order.dto";
import { RecordCheckoutFailureDto } from "./dto/record-checkout-failure.dto";
import { UpdateFinanceNotesDto } from "./dto/update-finance-notes.dto";
import { PaymentSessionsService } from "./payment-sessions.service";

type RequestContext = {
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;
};

type LoadedPaymentSession = Awaited<
  ReturnType<PaymentSessionsService["getSessionForFinance"]>
>;

type PrepareCheckoutOptions = {
  /** When provided (e.g. quick-collect), skips redundant session reloads. */
  session?: LoadedPaymentSession;
};

@Injectable()
export class PaymentSessionCheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly checkoutRegistry: CheckoutGatewayRegistry,
    private readonly sessionsService: PaymentSessionsService,
    private readonly gatewayHealth: GatewayHealthService,
  ) {}

  private assertFinance(user: AuthenticatedUser) {
    if (!hasFinanceAccess(user.role)) {
      throw new BadRequestException("Only finance administrators can access checkout operations");
    }
  }

  /**
   * One round-trip: ensure PROCESSING, return PayPal config, create order when missing.
   */
  async prepareCheckout(
    user: AuthenticatedUser,
    sessionId: string,
    ctx: RequestContext = {},
    options: PrepareCheckoutOptions = {},
  ) {
    this.assertFinance(user);

    let session = options.session ?? (await this.sessionsService.getSessionForFinance(sessionId));

    if (session.status === PaymentSessionStatus.PENDING) {
      session = await this.sessionsService.start(user, sessionId, ctx);
    }

    const { gateway, adapter } = await this.checkoutRegistry.resolveCheckoutAdapter(session.gateway_id);
    if (!gateway.isActive) {
      throw new BadRequestException("Selected payment gateway is inactive");
    }

    const configPayload = this.buildCheckoutConfigPayload(session, gateway, adapter);

    let order: {
      attempt_id: string;
      order_id: string;
      approve_url: string | null;
      attempt_number: number;
      status: PaymentAttemptStatus;
    } | null = null;

    const needsOrder =
      session.status === PaymentSessionStatus.PROCESSING &&
      !session.provider_order_id &&
      configPayload.checkout.supported;

    if (needsOrder) {
      order = await this.createProviderOrderForSession(user, session, gateway, adapter, ctx);
      session = {
        ...session,
        provider_order_id: order.order_id,
        checkout_mode: adapter.checkoutMode,
      };
      configPayload.session.provider_order_id = order.order_id;
    } else if (session.provider_order_id) {
      order = {
        attempt_id: "",
        order_id: session.provider_order_id,
        approve_url: null,
        attempt_number: 0,
        status: PaymentAttemptStatus.ORDER_CREATED,
      };
    }

    return {
      ...configPayload,
      order,
    };
  }

  private buildCheckoutConfigPayload(
    session: LoadedPaymentSession,
    gateway: Awaited<ReturnType<CheckoutGatewayRegistry["resolveCheckoutAdapter"]>>["gateway"],
    adapter: Awaited<ReturnType<CheckoutGatewayRegistry["resolveCheckoutAdapter"]>>["adapter"],
  ) {
    const publicConfig = adapter.getPublicConfig(gateway.credentials, gateway.settings, {
      amount: Number(session.amount),
      currency: session.currency,
    });

    return {
      session: {
        id: session.id,
        status: session.status,
        amount: Number(session.amount),
        currency: session.currency,
        gateway_id: session.gateway_id,
        provider_order_id: session.provider_order_id,
        checkout_mode: session.checkout_mode,
        finance_notes: session.finance_notes,
      },
      checkout: publicConfig,
      gateway: {
        id: gateway.id,
        name: gateway.name,
        type: gateway.type,
      },
    };
  }

  async getCheckoutConfig(user: AuthenticatedUser, sessionId: string) {
    this.assertFinance(user);
    const session = await this.sessionsService.getSessionForFinance(sessionId);
    const { gateway, adapter } = await this.checkoutRegistry.resolveCheckoutAdapter(session.gateway_id);

    if (!gateway.isActive) {
      throw new BadRequestException("Selected payment gateway is inactive");
    }

    return this.buildCheckoutConfigPayload(session, gateway, adapter);
  }

  async createProviderOrder(user: AuthenticatedUser, sessionId: string, ctx: RequestContext = {}) {
    this.assertFinance(user);
    const session = await this.sessionsService.getSessionForFinance(sessionId);

    if (session.status !== PaymentSessionStatus.PROCESSING) {
      throw new BadRequestException("Payment session must be in PROCESSING status before creating an order");
    }

    const { gateway, adapter } = await this.checkoutRegistry.resolveCheckoutAdapter(session.gateway_id);
    const config = adapter.getPublicConfig(gateway.credentials, gateway.settings, {
      amount: Number(session.amount),
      currency: session.currency,
    });
    if (!config.supported) {
      throw new BadRequestException(config.message ?? `Checkout is not supported for ${gateway.type}`);
    }

    return this.createProviderOrderForSession(user, session, gateway, adapter, ctx);
  }

  private async createProviderOrderForSession(
    user: AuthenticatedUser,
    session: LoadedPaymentSession,
    gateway: Awaited<ReturnType<CheckoutGatewayRegistry["resolveCheckoutAdapter"]>>["gateway"],
    adapter: Awaited<ReturnType<CheckoutGatewayRegistry["resolveCheckoutAdapter"]>>["adapter"],
    ctx: RequestContext,
  ) {
    const sessionId = session.id;
    const attemptNumber =
      (await this.prisma.paymentSessionAttempt.count({ where: { payment_session_id: sessionId } })) + 1;

    const attempt = await this.prisma.paymentSessionAttempt.create({
      data: {
        payment_session_id: sessionId,
        gateway_id: session.gateway_id,
        attempt_number: attemptNumber,
        status: PaymentAttemptStatus.INITIATED,
        initiated_by_id: user.id,
      },
    });

    try {
      const order = await adapter.createOrder(gateway.credentials, {
        amount: Number(session.amount),
        currency: session.currency,
        reference: `ps-${session.id}-a${attemptNumber}`,
        sessionId: session.id,
        description: `Booking payment session ${session.id.slice(0, 8)}`,
      });

      const sanitized = sanitizeProviderResponse(order.rawResponse);

      await this.prisma.paymentSessionAttempt.update({
        where: { id: attempt.id },
        data: {
          status: PaymentAttemptStatus.ORDER_CREATED,
          provider_order_id: order.orderId,
          provider_response: sanitized as Prisma.InputJsonValue,
        },
      });

      await this.prisma.paymentSession.update({
        where: { id: sessionId },
        data: {
          provider_order_id: order.orderId,
          checkout_mode: adapter.checkoutMode,
        },
      });

      void this.auditLog.log({
        action:
          gateway.type === PaymentGatewayType.paypal
            ? AuditLogAction.PAYPAL_ORDER_CREATED
            : AuditLogAction.PAYMENT_ATTEMPT_CREATED,
        resourceType: "payment_session",
        resourceId: sessionId,
        userId: user.id,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        requestMethod: ctx.requestMethod,
        requestPath: ctx.requestPath,
        metadata: {
          orderId: order.orderId,
          attemptId: attempt.id,
          attemptNumber,
          gatewayId: gateway.id,
          gatewayType: gateway.type,
        },
      });

      return {
        attempt_id: attempt.id,
        order_id: order.orderId,
        approve_url: order.approveUrl ?? null,
        attempt_number: attemptNumber,
        status: PaymentAttemptStatus.ORDER_CREATED,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.prisma.paymentSessionAttempt.update({
        where: { id: attempt.id },
        data: {
          status: PaymentAttemptStatus.FAILED,
          failure_reason: message,
        },
      });

      await this.auditLog.log({
        action: AuditLogAction.PAYMENT_ATTEMPT_FAILED,
        resourceType: "payment_session_attempt",
        resourceId: attempt.id,
        userId: user.id,
        metadata: { sessionId, reason: message },
      });

      throw new BadRequestException(message);
    }
  }

  async markAttemptSubmitted(user: AuthenticatedUser, sessionId: string, orderId: string) {
    this.assertFinance(user);
    const attempt = await this.findAttemptByOrder(sessionId, orderId);
    if (!attempt) throw new NotFoundException("Payment attempt not found for order");

    return this.prisma.paymentSessionAttempt.update({
      where: { id: attempt.id },
      data: { status: PaymentAttemptStatus.SUBMITTED },
    });
  }

  async captureProviderOrder(
    user: AuthenticatedUser,
    sessionId: string,
    dto: CaptureCheckoutOrderDto,
    ctx: RequestContext = {},
  ) {
    this.assertFinance(user);
    const session = await this.sessionsService.getSessionForFinance(sessionId);

    if (session.status !== PaymentSessionStatus.PROCESSING) {
      throw new BadRequestException("Payment session must be in PROCESSING status to capture");
    }

    const attempt = await this.findAttemptByOrder(sessionId, dto.order_id);
    if (!attempt) {
      throw new NotFoundException("No payment attempt found for this order ID");
    }

    const { gateway, adapter } = await this.checkoutRegistry.resolveCheckoutAdapter(session.gateway_id);

    const captureResult = await adapter.captureOrder(gateway.credentials, dto.order_id);

    if (captureResult.status !== PaymentStatus.SUCCESS) {
      await this.recordAttemptFailureInternal(
        attempt.id,
        sessionId,
        user,
        captureResult.failureReason ?? "Capture failed",
        dto.order_id,
        captureResult.rawResponse,
        ctx,
      );
      throw new BadRequestException(captureResult.failureReason ?? "Payment capture failed");
    }

    const captureId =
      extractPaypalCaptureId(captureResult.rawResponse, captureResult.providerReference) ??
      extractCaptureId(captureResult.rawResponse);

    if (!captureId?.trim()) {
      const message =
        "PayPal did not return a capture ID — payment was not settled in PayPal. Check sandbox credentials and card approval.";
      await this.recordAttemptFailureInternal(
        attempt.id,
        sessionId,
        user,
        message,
        dto.order_id,
        captureResult.rawResponse,
        ctx,
      );
      throw new BadRequestException(message);
    }

    await this.auditLog.log({
      action:
        gateway.type === PaymentGatewayType.paypal
          ? AuditLogAction.PAYPAL_ORDER_CAPTURED
          : AuditLogAction.PAYMENT_SUCCESS,
      resourceType: "payment_session",
      resourceId: sessionId,
      userId: user.id,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      requestMethod: ctx.requestMethod,
      requestPath: ctx.requestPath,
      metadata: {
        orderId: dto.order_id,
        captureId,
        attemptId: attempt.id,
      },
    });

    return this.sessionsService.finalizeSuccessfulCheckout(
      session,
      user,
      {
        providerReference: captureId,
        providerResponse: sanitizeProviderResponse(captureResult.rawResponse),
        financeNotes: dto.finance_notes ?? session.finance_notes,
        attemptId: attempt.id,
        captureId,
      },
      ctx,
    );
  }

  async recordCheckoutFailure(
    user: AuthenticatedUser,
    sessionId: string,
    dto: RecordCheckoutFailureDto,
    ctx: RequestContext = {},
  ) {
    this.assertFinance(user);

    const attempt = dto.order_id
      ? await this.findAttemptByOrder(sessionId, dto.order_id)
      : await this.prisma.paymentSessionAttempt.findFirst({
          where: { payment_session_id: sessionId },
          orderBy: { created_at: "desc" },
        });

    if (!attempt) {
      throw new NotFoundException("No payment attempt found to record failure");
    }

    await this.recordAttemptFailureInternal(
      attempt.id,
      sessionId,
      user,
      dto.failure_reason,
      dto.order_id,
      undefined,
      ctx,
    );

    if (dto.finance_notes) {
      await this.updateFinanceNotes(user, sessionId, { finance_notes: dto.finance_notes }, ctx);
    }

    return this.sessionsService.getSessionForFinance(sessionId);
  }

  async updateFinanceNotes(
    user: AuthenticatedUser,
    sessionId: string,
    dto: UpdateFinanceNotesDto,
    ctx: RequestContext = {},
  ) {
    this.assertFinance(user);

    await this.prisma.paymentSession.update({
      where: { id: sessionId },
      data: { finance_notes: dto.finance_notes.trim() },
    });

    await this.auditLog.log({
      action: AuditLogAction.PAYMENT_SESSION_OPENED,
      resourceType: "payment_session",
      resourceId: sessionId,
      userId: user.id,
      ipAddress: ctx.ipAddress,
      metadata: { action: "finance_notes_updated" },
    });

    return this.sessionsService.getSessionForFinance(sessionId);
  }

  async listAttempts(user: AuthenticatedUser, sessionId: string) {
    this.assertFinance(user);
    return this.prisma.paymentSessionAttempt.findMany({
      where: { payment_session_id: sessionId },
      orderBy: { created_at: "desc" },
      include: {
        initiated_by: { select: { id: true, name: true, email: true } },
        gateway: { select: { id: true, name: true, type: true } },
      },
    });
  }

  async getGatewayHealth(user: AuthenticatedUser) {
    this.assertFinance(user);
    const { data } = await this.gatewayHealth.getGatewayHealth();

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const attemptStats = await this.prisma.paymentSessionAttempt.groupBy({
      by: ["gateway_id", "status"],
      where: { created_at: { gte: since } },
      _count: { id: true },
    });

    const statsMap = new Map<string, { total: number; captured: number; failed: number }>();
    for (const row of attemptStats) {
      const current = statsMap.get(row.gateway_id) ?? { total: 0, captured: 0, failed: 0 };
      current.total += row._count.id;
      if (row.status === PaymentAttemptStatus.CAPTURED) current.captured += row._count.id;
      if (row.status === PaymentAttemptStatus.FAILED) current.failed += row._count.id;
      statsMap.set(row.gateway_id, current);
    }

    return data.map((row) => {
      const stats = statsMap.get(row.gateway_id) ?? { total: 0, captured: 0, failed: 0 };
      const successRate =
        stats.total > 0 ? Math.round((stats.captured / stats.total) * 100) : null;

      return {
        ...row,
        is_active: row.is_active,
        healthy: row.status === "CONNECTED",
        latency_ms: 0,
        health_message: row.detail ?? null,
        attempts_24h: stats.total,
        captured_24h: stats.captured,
        failed_24h: stats.failed,
        success_rate_24h: successRate,
      };
    });
  }

  private async findAttemptByOrder(sessionId: string, orderId: string) {
    return this.prisma.paymentSessionAttempt.findFirst({
      where: { payment_session_id: sessionId, provider_order_id: orderId },
      orderBy: { created_at: "desc" },
    });
  }

  private async recordAttemptFailureInternal(
    attemptId: string,
    sessionId: string,
    user: AuthenticatedUser,
    reason: string,
    orderId?: string,
    rawResponse?: unknown,
    ctx: RequestContext = {},
  ) {
    await this.prisma.paymentSessionAttempt.update({
      where: { id: attemptId },
      data: {
        status: PaymentAttemptStatus.FAILED,
        failure_reason: reason,
        provider_response: rawResponse
          ? (sanitizeProviderResponse(rawResponse) as Prisma.InputJsonValue)
          : undefined,
      },
    });

    await this.auditLog.log({
      action: AuditLogAction.PAYMENT_ATTEMPT_FAILED,
      resourceType: "payment_session_attempt",
      resourceId: attemptId,
      userId: user.id,
      ipAddress: ctx.ipAddress,
      metadata: { sessionId, orderId, reason },
    });
  }
}

function extractCaptureId(rawResponse: unknown): string | undefined {
  if (!rawResponse || typeof rawResponse !== "object") return undefined;
  const payload = rawResponse as {
    purchase_units?: Array<{
      payments?: { captures?: Array<{ id?: string }> };
    }>;
  };
  return payload.purchase_units?.[0]?.payments?.captures?.[0]?.id;
}
