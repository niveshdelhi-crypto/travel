import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { AuditLogAction, PaymentGatewayType } from "@prisma/client";
import type { Request } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import { PaypalPaymentProvider } from "../providers/paypal.provider";
import { extractPaypalCaptureId, extractPaypalOrderId } from "../utils/paypal-payload.util";
import { GatewayRegistryService } from "./gateway-registry.service";
import { AuditLogService } from "./audit-log.service";

type PayPalWebhookEvent = {
  id?: string;
  event_type?: string;
  resource?: Record<string, unknown>;
  summary?: string;
};

@Injectable()
export class PaypalWebhookService {
  private readonly logger = new Logger(PaypalWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gatewayRegistry: GatewayRegistryService,
    private readonly paypal: PaypalPaymentProvider,
    private readonly auditLog: AuditLogService,
  ) {}

  async handleIncoming(req: Request, body: PayPalWebhookEvent) {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
    if (!webhookId) {
      this.logger.warn(
        JSON.stringify({
          message: "paypal.webhook.unconfigured",
          hint: "Set PAYPAL_WEBHOOK_ID and register POST /api/payments/webhooks/paypal in PayPal Developer Dashboard",
        }),
      );
    } else {
      const verified = await this.verifySignature(req, body, webhookId);
      if (!verified) {
        throw new BadRequestException("Invalid PayPal webhook signature");
      }
    }

    const eventType = body.event_type ?? "UNKNOWN";
    const resource = body.resource ?? {};
    const orderId = extractPaypalOrderId(resource) ?? this.readString(resource, "id");
    const captureId =
      extractPaypalCaptureId(resource) ?? this.readString(resource, "id") ?? undefined;

    this.logger.log(
      JSON.stringify({
        message: "paypal.webhook.received",
        eventType,
        eventId: body.id,
        orderId,
        captureId,
      }),
    );

    await this.auditLog.log({
      action: AuditLogAction.PAYMENT_ROUTE_ACCESSED,
      resourceType: "paypal_webhook",
      resourceId: body.id ?? orderId ?? "unknown",
      metadata: {
        event_type: eventType,
        order_id: orderId,
        capture_id: captureId,
        summary: body.summary,
      },
    });
  }

  private async verifySignature(
    req: Request,
    body: PayPalWebhookEvent,
    webhookId: string,
  ): Promise<boolean> {
    const transmissionId = this.header(req, "paypal-transmission-id");
    const transmissionTime = this.header(req, "paypal-transmission-time");
    const certUrl = this.header(req, "paypal-cert-url");
    const authAlgo = this.header(req, "paypal-auth-algo");
    const transmissionSig = this.header(req, "paypal-transmission-sig");

    if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
      this.logger.warn(JSON.stringify({ message: "paypal.webhook.missing_signature_headers" }));
      return false;
    }

    const gateway = await this.prisma.paymentGateway.findFirst({
      where: { is_active: true, type: PaymentGatewayType.paypal },
      orderBy: { created_at: "asc" },
    });
    if (!gateway) return false;

    const resolved = await this.gatewayRegistry.resolveGateway(gateway.id);
    const credentials = this.paypal.resolveCredentials(resolved.credentials, resolved.settings);

    return this.paypal.verifyWebhookSignature(credentials, {
      webhookId,
      authAlgo,
      certUrl,
      transmissionId,
      transmissionSig,
      transmissionTime,
      webhookEvent: body,
    });
  }

  private header(req: Request, name: string): string | undefined {
    const value = req.headers[name];
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  }

  private readString(obj: Record<string, unknown>, key: string): string | undefined {
    const value = obj[key];
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  }
}
