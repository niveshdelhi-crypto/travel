import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AuditLogAction,
  PaymentAttemptStatus,
  PaymentGatewayType,
  PaymentStatus,
  Prisma,
  TransactionType,
} from "@prisma/client";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user";
import { PrismaService } from "../../prisma/prisma.service";
import { PaypalPaymentProvider } from "../providers/paypal.provider";
import {
  extractPaypalCaptureId,
  extractPaypalOrderId,
} from "../utils/paypal-payload.util";
import { sanitizeProviderResponse } from "../payment-sessions/checkout/sanitize-provider-response.util";
import { GatewayRegistryService } from "./gateway-registry.service";
import { AuditLogService } from "./audit-log.service";
import { PaymentTransactionService } from "./payment-transaction.service";
import { PaymentSessionCheckoutService } from "../payment-sessions/payment-session-checkout.service";
import type {
  PaymentTestingAttemptActionDto,
  PaymentTestingRefundDto,
} from "../dto/payment-testing.dto";

export type PayPalEnvironment = "sandbox" | "live";

export type PaymentTestingCaptureRow = {
  id: string;
  source: "session_attempt" | "transaction";
  paypal_order_id: string | null;
  paypal_capture_id: string | null;
  gateway_id: string;
  gateway_name: string;
  environment: PayPalEnvironment;
  amount: number;
  currency: string;
  customer_name: string;
  booking_id: string;
  lead_id: string;
  session_id: string | null;
  transaction_id: string | null;
  status: string;
  captured_at: string;
};

export type PaymentTestingFailureRow = {
  id: string;
  source: "session_attempt" | "transaction";
  paypal_order_id: string | null;
  gateway_name: string;
  environment: PayPalEnvironment;
  amount: number;
  currency: string;
  customer_name: string;
  booking_id: string;
  failure_reason: string | null;
  failed_at: string;
};

export type PaymentTestingRefundRow = {
  id: string;
  paypal_capture_id: string | null;
  paypal_refund_id: string | null;
  gateway_name: string;
  environment: PayPalEnvironment;
  amount: number;
  currency: string;
  customer_name: string;
  booking_id: string;
  refunded_at: string;
};

type RequestContext = {
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;
};

@Injectable()
export class PaymentTestingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gatewayRegistry: GatewayRegistryService,
    private readonly paypal: PaypalPaymentProvider,
    private readonly auditLog: AuditLogService,
    private readonly transactions: PaymentTransactionService,
    private readonly checkout: PaymentSessionCheckoutService,
  ) {}

  private resolveEnvironment(
    credentials: Record<string, string>,
    settings: Record<string, unknown> | null,
  ): PayPalEnvironment {
    if (credentials.environment === "live" || settings?.environment === "live") {
      return "live";
    }
    return "sandbox";
  }

  private async resolvePaypalGateways(environment: PayPalEnvironment) {
    const gateways = await this.prisma.paymentGateway.findMany({
      where: { type: PaymentGatewayType.paypal, is_active: true },
    });

    const matched: Array<{ id: string; name: string; environment: PayPalEnvironment }> = [];

    for (const gateway of gateways) {
      const resolved = await this.gatewayRegistry.resolveGateway(gateway.id);
      const env = this.resolveEnvironment(resolved.credentials, resolved.settings);
      if (env === environment) {
        matched.push({ id: gateway.id, name: gateway.name, environment: env });
      }
    }

    return matched;
  }

  async getConsole(environment: PayPalEnvironment = "sandbox") {
    const gateways = await this.resolvePaypalGateways(environment);

    const [captures, failures, refunds] = await Promise.all([
      this.listCaptures(environment, 30),
      this.listFailures(environment, 30),
      this.listRefunds(environment, 30),
    ]);

    return {
      environment,
      gateways,
      recent_captures: captures,
      recent_failures: failures,
      recent_refunds: refunds,
    };
  }

  async listCaptures(environment: PayPalEnvironment, limit = 50): Promise<PaymentTestingCaptureRow[]> {
    const gateways = await this.resolvePaypalGateways(environment);
    const gatewayIds = gateways.map((g) => g.id);
    if (!gatewayIds.length) return [];

    const gatewayMap = new Map(gateways.map((g) => [g.id, g]));

    const attempts = await this.prisma.paymentSessionAttempt.findMany({
      where: {
        gateway_id: { in: gatewayIds },
        status: PaymentAttemptStatus.CAPTURED,
      },
      include: {
        gateway: { select: { id: true, name: true } },
        payment_session: {
          include: {
            lead: { select: { id: true, customer_name: true } },
            booking: { select: { id: true } },
          },
        },
      },
      orderBy: { updated_at: "desc" },
      take: limit,
    });

    const transactions = await this.prisma.paymentTransaction.findMany({
      where: {
        gateway_id: { in: gatewayIds },
        status: PaymentStatus.SUCCESS,
        type: TransactionType.CHARGE,
      },
      include: {
        gateway: { select: { id: true, name: true } },
        booking: {
          select: {
            id: true,
            lead_id: true,
            lead: { select: { customer_name: true } },
          },
        },
      },
      orderBy: { processed_at: "desc" },
      take: limit,
    });

    const rows: PaymentTestingCaptureRow[] = [];
    const seenCaptureIds = new Set<string>();

    for (const attempt of attempts) {
      const session = attempt.payment_session;
      const gw = gatewayMap.get(attempt.gateway_id);
      const captureId =
        attempt.provider_capture_id ??
        extractPaypalCaptureId(attempt.provider_response) ??
        null;
      const orderId =
        attempt.provider_order_id ?? extractPaypalOrderId(attempt.provider_response) ?? null;

      if (captureId) {
        if (seenCaptureIds.has(captureId)) continue;
        seenCaptureIds.add(captureId);
      }

      rows.push({
        id: attempt.id,
        source: "session_attempt",
        paypal_order_id: orderId,
        paypal_capture_id: captureId,
        gateway_id: attempt.gateway_id,
        gateway_name: attempt.gateway.name,
        environment: gw?.environment ?? environment,
        amount: Number(session.amount),
        currency: session.currency,
        customer_name: session.lead.customer_name,
        booking_id: session.booking_id,
        lead_id: session.lead_id,
        session_id: session.id,
        transaction_id: null,
        status: attempt.status,
        captured_at: attempt.updated_at.toISOString(),
      });
    }

    for (const txn of transactions) {
      const captureId =
        extractPaypalCaptureId(txn.provider_response, txn.provider_reference) ?? null;
      const orderId = extractPaypalOrderId(txn.provider_response) ?? null;
      const gw = gatewayMap.get(txn.gateway_id);

      if (captureId) {
        if (seenCaptureIds.has(captureId)) continue;
        seenCaptureIds.add(captureId);
      }

      rows.push({
        id: txn.id,
        source: "transaction",
        paypal_order_id: orderId,
        paypal_capture_id: captureId ?? txn.provider_reference,
        gateway_id: txn.gateway_id,
        gateway_name: txn.gateway.name,
        environment: gw?.environment ?? environment,
        amount: Number(txn.amount),
        currency: txn.currency,
        customer_name: txn.booking.lead.customer_name,
        booking_id: txn.booking_id,
        lead_id: txn.booking.lead_id,
        session_id: txn.payment_session_id,
        transaction_id: txn.id,
        status: txn.status,
        captured_at: (txn.processed_at ?? txn.created_at).toISOString(),
      });
    }

    return rows
      .sort((a, b) => b.captured_at.localeCompare(a.captured_at))
      .slice(0, limit);
  }

  async listFailures(environment: PayPalEnvironment, limit = 50): Promise<PaymentTestingFailureRow[]> {
    const gateways = await this.resolvePaypalGateways(environment);
    const gatewayIds = gateways.map((g) => g.id);
    if (!gatewayIds.length) return [];

    const gatewayMap = new Map(gateways.map((g) => [g.id, g]));

    const [attempts, transactions] = await Promise.all([
      this.prisma.paymentSessionAttempt.findMany({
        where: { gateway_id: { in: gatewayIds }, status: PaymentAttemptStatus.FAILED },
        include: {
          gateway: { select: { name: true } },
          payment_session: {
            include: {
              lead: { select: { customer_name: true } },
              booking: { select: { id: true } },
            },
          },
        },
        orderBy: { updated_at: "desc" },
        take: limit,
      }),
      this.prisma.paymentTransaction.findMany({
        where: { gateway_id: { in: gatewayIds }, status: PaymentStatus.FAILED },
        include: {
          gateway: { select: { name: true } },
          booking: { select: { id: true, lead: { select: { customer_name: true } } } },
        },
        orderBy: { updated_at: "desc" },
        take: limit,
      }),
    ]);

    const rows: PaymentTestingFailureRow[] = [];

    for (const attempt of attempts) {
      const session = attempt.payment_session;
      const gw = gatewayMap.get(attempt.gateway_id);
      rows.push({
        id: attempt.id,
        source: "session_attempt",
        paypal_order_id:
          attempt.provider_order_id ?? extractPaypalOrderId(attempt.provider_response) ?? null,
        gateway_name: attempt.gateway.name,
        environment: gw?.environment ?? environment,
        amount: Number(session.amount),
        currency: session.currency,
        customer_name: session.lead.customer_name,
        booking_id: session.booking_id,
        failure_reason: attempt.failure_reason,
        failed_at: attempt.updated_at.toISOString(),
      });
    }

    for (const txn of transactions) {
      const gw = gatewayMap.get(txn.gateway_id);
      rows.push({
        id: txn.id,
        source: "transaction",
        paypal_order_id: extractPaypalOrderId(txn.provider_response) ?? txn.provider_reference,
        gateway_name: txn.gateway.name,
        environment: gw?.environment ?? environment,
        amount: Number(txn.amount),
        currency: txn.currency,
        customer_name: txn.booking.lead.customer_name,
        booking_id: txn.booking_id,
        failure_reason: txn.failure_reason,
        failed_at: (txn.processed_at ?? txn.updated_at).toISOString(),
      });
    }

    return rows.sort((a, b) => b.failed_at.localeCompare(a.failed_at)).slice(0, limit);
  }

  async listRefunds(environment: PayPalEnvironment, limit = 50): Promise<PaymentTestingRefundRow[]> {
    const gateways = await this.resolvePaypalGateways(environment);
    const gatewayIds = gateways.map((g) => g.id);
    if (!gatewayIds.length) return [];

    const gatewayMap = new Map(gateways.map((g) => [g.id, g]));

    const refunds = await this.prisma.paymentTransaction.findMany({
      where: {
        gateway_id: { in: gatewayIds },
        OR: [{ type: TransactionType.REFUND }, { status: PaymentStatus.REFUNDED }],
      },
      include: {
        gateway: { select: { name: true } },
        booking: { select: { id: true, lead: { select: { customer_name: true } } } },
      },
      orderBy: { processed_at: "desc" },
      take: limit,
    });

    return refunds.map((txn) => {
      const gw = gatewayMap.get(txn.gateway_id);
      return {
        id: txn.id,
        paypal_capture_id: extractPaypalCaptureId(txn.provider_response) ?? null,
        paypal_refund_id: txn.provider_reference,
        gateway_name: txn.gateway.name,
        environment: gw?.environment ?? environment,
        amount: Number(txn.amount),
        currency: txn.currency,
        customer_name: txn.booking.lead.customer_name,
        booking_id: txn.booking_id,
        refunded_at: (txn.processed_at ?? txn.created_at).toISOString(),
      };
    });
  }

  async getAuditTrail(resourceType: string, resourceId: string) {
    return this.prisma.auditLog.findMany({
      where: { resource_type: resourceType, resource_id: resourceId },
      orderBy: { created_at: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  private async findAttempt(input: {
    attempt_id?: string;
    order_id?: string;
    session_id?: string;
  }) {
    if (input.attempt_id) {
      const attempt = await this.prisma.paymentSessionAttempt.findUnique({
        where: { id: input.attempt_id },
        include: {
          payment_session: true,
          gateway: true,
        },
      });
      if (!attempt) throw new NotFoundException("Payment attempt not found");
      return attempt;
    }

    if (input.order_id) {
      const attempt = await this.prisma.paymentSessionAttempt.findFirst({
        where: { provider_order_id: input.order_id },
        orderBy: { created_at: "desc" },
        include: { payment_session: true, gateway: true },
      });
      if (!attempt) throw new NotFoundException("Payment attempt not found for order");
      return attempt;
    }

    if (input.session_id) {
      const attempt = await this.prisma.paymentSessionAttempt.findFirst({
        where: { payment_session_id: input.session_id },
        orderBy: { created_at: "desc" },
        include: { payment_session: true, gateway: true },
      });
      if (!attempt) throw new NotFoundException("No payment attempt for session");
      return attempt;
    }

    throw new BadRequestException("attempt_id, order_id, or session_id is required");
  }

  async retryCapture(user: AuthenticatedUser, input: PaymentTestingAttemptActionDto, ctx: RequestContext) {
    const attempt = await this.findAttempt(input);
    if (attempt.gateway.type !== PaymentGatewayType.paypal) {
      throw new BadRequestException("Retry capture is only supported for PayPal");
    }

    const orderId = attempt.provider_order_id;
    if (!orderId) {
      throw new BadRequestException("Attempt has no PayPal order ID");
    }

    if (attempt.status === PaymentAttemptStatus.CAPTURED) {
      throw new BadRequestException("This attempt is already captured");
    }

    await this.auditLog.log({
      action: AuditLogAction.PAYMENT_PROCESSING,
      resourceType: "payment_session_attempt",
      resourceId: attempt.id,
      userId: user.id,
      ipAddress: ctx.ipAddress,
      metadata: { orderId, source: "payment_testing_retry_capture" },
    });

    return this.checkout.captureProviderOrder(
      user,
      attempt.payment_session_id,
      { order_id: orderId },
      ctx,
    );
  }

  async voidOrder(user: AuthenticatedUser, input: PaymentTestingAttemptActionDto, ctx: RequestContext) {
    const attempt = await this.findAttempt(input);
    if (attempt.gateway.type !== PaymentGatewayType.paypal) {
      throw new BadRequestException("Void is only supported for PayPal");
    }

    const orderId = attempt.provider_order_id;
    if (!orderId) {
      throw new BadRequestException("Attempt has no PayPal order ID");
    }

    const resolved = await this.gatewayRegistry.resolveGateway(attempt.gateway_id);
    const voidResult = await this.paypal.voidCheckoutOrder(resolved.credentials, orderId);

    await this.auditLog.log({
      action: AuditLogAction.PAYMENT_FAILED,
      resourceType: "payment_session_attempt",
      resourceId: attempt.id,
      userId: user.id,
      ipAddress: ctx.ipAddress,
      metadata: {
        orderId,
        action: "void_order",
        providerMessage: voidResult.failureReason,
        raw: voidResult.rawResponse
          ? (sanitizeProviderResponse(voidResult.rawResponse) as Prisma.InputJsonValue)
          : undefined,
      },
    });

    if (voidResult.failureReason && voidResult.rawResponse) {
      const status = (voidResult.rawResponse as { status?: string }).status?.toUpperCase();
      if (status !== "VOIDED" && voidResult.failureReason.includes("not approved")) {
        return {
          order_id: orderId,
          status: "NO_AUTHORIZATION",
          message: voidResult.failureReason,
        };
      }
    }

    return {
      order_id: orderId,
      status: "VOIDED",
      provider_reference: voidResult.providerReference,
      raw_response: sanitizeProviderResponse(voidResult.rawResponse),
    };
  }

  async refundCapture(user: AuthenticatedUser, input: PaymentTestingRefundDto, ctx: RequestContext) {
    let captureId = input.capture_id?.trim();
    let transactionId = input.transaction_id;

    if (!captureId && transactionId) {
      const txn = await this.prisma.paymentTransaction.findUnique({
        where: { id: transactionId },
        include: { gateway: true },
      });
      if (!txn) throw new NotFoundException("Transaction not found");
      if (txn.gateway.type !== PaymentGatewayType.paypal) {
        throw new BadRequestException("Refunds are only supported for PayPal transactions");
      }
      captureId =
        extractPaypalCaptureId(txn.provider_response, txn.provider_reference) ??
        txn.provider_reference ??
        undefined;
      if (!captureId) {
        throw new BadRequestException("Transaction has no PayPal capture ID");
      }
    }

    if (!captureId && input.attempt_id) {
      const attempt = await this.findAttempt({ attempt_id: input.attempt_id });
      captureId =
        attempt.provider_capture_id ??
        extractPaypalCaptureId(attempt.provider_response) ??
        undefined;
      transactionId = transactionId ?? undefined;
    }

    if (!captureId) {
      throw new BadRequestException("capture_id, transaction_id, or attempt_id with capture is required");
    }

    if (transactionId) {
      return this.transactions.refundTransaction(user, transactionId, input.reason);
    }

    const txn = await this.prisma.paymentTransaction.findFirst({
      where: {
        provider_reference: captureId,
        status: PaymentStatus.SUCCESS,
        type: TransactionType.CHARGE,
      },
      include: { gateway: true },
    });

    if (txn) {
      return this.transactions.refundTransaction(user, txn.id, input.reason);
    }

    const attempt = await this.prisma.paymentSessionAttempt.findFirst({
      where: {
        OR: [{ provider_capture_id: captureId }, { provider_order_id: input.order_id }],
        status: PaymentAttemptStatus.CAPTURED,
      },
      include: { payment_session: true, gateway: true },
    });

    if (!attempt) {
      throw new NotFoundException("No captured payment found for this capture ID");
    }

    const resolved = await this.gatewayRegistry.resolveGateway(attempt.gateway_id);
    const amount = input.amount ?? Number(attempt.payment_session.amount);
    const currency = attempt.payment_session.currency;

    const refundResult = await this.paypal.refundPayment(resolved.credentials, {
      providerReference: captureId,
      amount,
      currency,
      reason: input.reason,
    });

    if (refundResult.status !== PaymentStatus.REFUNDED) {
      throw new BadRequestException(refundResult.failureReason ?? "PayPal refund failed");
    }

    await this.auditLog.log({
      action: AuditLogAction.PAYMENT_REFUNDED,
      resourceType: "payment_session_attempt",
      resourceId: attempt.id,
      userId: user.id,
      ipAddress: ctx.ipAddress,
      metadata: {
        captureId,
        refundId: refundResult.providerReference,
        amount,
        currency,
        source: "payment_testing_console",
      },
    });

    return {
      capture_id: captureId,
      refund_id: refundResult.providerReference,
      status: PaymentStatus.REFUNDED,
      raw_response: sanitizeProviderResponse(refundResult.rawResponse),
    };
  }
}
