import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { PaymentGatewayType, PaymentStatus } from "@prisma/client";
import {
  extractPaypalAuthorizationId,
  extractPaypalCaptureId,
  formatPaypalApiError,
  getPaypalOrderStatus,
  isPaypalOrderCaptured,
  type PayPalApiErrorPayload,
  type PayPalOrderPayload,
} from "../utils/paypal-payload.util";
import type {
  CreatePaymentParams,
  PaymentProviderStrategy,
  ProviderCredentials,
  ProviderPaymentResult,
  RefundPaymentParams,
} from "./payment-provider.interface";
import type { PaypalEnvironment, PaypalHealthDiagnostics } from "./paypal-health.types";

const PAYPAL_CARD_SCOPES = [
  "https://uri.paypal.com/services/payments/payment",
  "https://uri.paypal.com/services/payments",
  "https://uri.paypal.com/services/payments/realtimepayment",
];

type CachedOAuthToken = {
  accessToken: string;
  expiresAtMs: number;
};

@Injectable()
export class PaypalPaymentProvider implements PaymentProviderStrategy {
  readonly gatewayType = PaymentGatewayType.paypal;
  private readonly logger = new Logger(PaypalPaymentProvider.name);
  private readonly oauthTokenCache = new Map<string, CachedOAuthToken>();

  resolveEnvironment(
    credentials: ProviderCredentials,
    settings?: Record<string, unknown> | null,
  ): PaypalEnvironment {
    if (credentials.environment === "live" || settings?.environment === "live") {
      return "live";
    }
    return "sandbox";
  }

  resolveCredentials(
    credentials: ProviderCredentials,
    settings?: Record<string, unknown> | null,
  ): ProviderCredentials {
    const environment = this.resolveEnvironment(credentials, settings);
    return { ...credentials, environment };
  }

  async runHealthDiagnostics(
    credentials: ProviderCredentials,
    settings?: Record<string, unknown> | null,
  ): Promise<PaypalHealthDiagnostics> {
    const resolved = this.resolveCredentials(credentials, settings);
    const environment = this.resolveEnvironment(resolved, settings);
    const currency = this.resolveProbeCurrency(settings);

    const result: PaypalHealthDiagnostics = {
      environment,
      environment_valid: true,
      oauth_valid: false,
      oauth_latency_ms: 0,
      orders_api: false,
      capture_api: false,
      card_processing_eligible: false,
      currency_supported: false,
      currency_tested: currency,
    };

    let accessToken: string;
    let oauthScopes = "";

    try {
      const oauth = await this.issueAccessToken(resolved);
      accessToken = oauth.accessToken;
      oauthScopes = oauth.scope;
      result.oauth_valid = true;
      result.oauth_latency_ms = oauth.latencyMs;
      result.oauth_scopes = oauth.scope;
    } catch (error) {
      result.oauth_message = error instanceof Error ? error.message : "PayPal OAuth failed";
      result.environment_valid = false;
      return result;
    }

    result.card_processing_eligible = this.evaluateCardProcessingScopes(oauthScopes);
    if (!result.card_processing_eligible) {
      result.card_processing_message =
        "OAuth token missing PayPal payments scope required for card processing (Advanced Card Fields)";
    }

    const orderProbe = await this.probeOrdersApi(resolved, accessToken, currency);
    result.orders_api = orderProbe.ok;
    result.orders_api_message = orderProbe.message;
    result.currency_supported = orderProbe.ok;
    result.currency_message = orderProbe.message;

    if (orderProbe.orderId) {
      const captureProbe = await this.probeCaptureApi(resolved, accessToken, orderProbe.orderId);
      result.capture_api = captureProbe.ok;
      result.capture_api_message = captureProbe.message;
    } else {
      result.capture_api = false;
      result.capture_api_message = "Capture probe skipped — order creation failed";
    }

    return result;
  }

  async createPayment(
    credentials: ProviderCredentials,
    params: CreatePaymentParams,
  ): Promise<ProviderPaymentResult> {
    const accessToken = await this.getAccessToken(credentials);
    const baseUrl = this.apiBase(credentials);

    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: params.reference,
            description: params.description,
            amount: {
              currency_code: params.currency.toUpperCase(),
              value: params.amount.toFixed(2),
            },
          },
        ],
        application_context: {
          return_url: params.returnUrl,
          cancel_url: params.cancelUrl,
        },
      }),
    });

    const payload = (await response.json()) as {
      id?: string;
      status?: string;
      links?: Array<{ rel: string; href: string }>;
      message?: string;
    };

    if (!response.ok) {
      const message = formatPaypalApiError(payload as PayPalApiErrorPayload);
      this.logger.warn(
        JSON.stringify({
          message: "paypal.create.failed",
          environment: credentials.environment ?? "sandbox",
          error: message,
        }),
      );
      return {
        providerReference: params.reference,
        status: PaymentStatus.FAILED,
        failureReason: message,
        rawResponse: payload,
      };
    }

    const approveLink = payload.links?.find((link) => link.rel === "approve");

    this.logger.log(
      JSON.stringify({
        message: "paypal.order.created",
        environment: credentials.environment ?? "sandbox",
        orderId: payload.id,
        status: payload.status,
      }),
    );

    return {
      providerReference: payload.id ?? params.reference,
      status: this.mapPaypalStatus(payload.status),
      checkoutUrl: approveLink?.href,
      rawResponse: payload,
    };
  }

  async capturePayment(
    credentials: ProviderCredentials,
    providerReference: string,
  ): Promise<ProviderPaymentResult> {
    const resolved = this.resolveCredentials(credentials);
    const accessToken = await this.getAccessToken(resolved);
    const baseUrl = this.apiBase(resolved);
    const captureUrl = `${baseUrl}/v2/checkout/orders/${providerReference}/capture`;

    this.logger.log(
      JSON.stringify({
        message: "paypal.capture.request",
        environment: resolved.environment ?? "sandbox",
        orderId: providerReference,
        url: captureUrl,
      }),
    );

    const response = await fetch(captureUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
    });

    const payload = (await response.json()) as PayPalApiErrorPayload & PayPalOrderPayload;

    if (!response.ok) {
      const issue = payload.details?.[0]?.issue;
      if (
        response.status === 422 &&
        (issue === "ORDER_ALREADY_CAPTURED" || issue === "ORDER_ALREADY_COMPLETED")
      ) {
        return this.resolveAlreadyCapturedOrder(resolved, providerReference, issue);
      }

      const failureReason = formatPaypalApiError(payload);
      this.logger.warn(
        JSON.stringify({
          message: "paypal.capture.failed",
          environment: resolved.environment ?? "sandbox",
          orderId: providerReference,
          httpStatus: response.status,
          issue,
          error: failureReason,
        }),
      );
      return {
        providerReference,
        status: PaymentStatus.FAILED,
        failureReason,
        rawResponse: payload,
      };
    }

    if (!isPaypalOrderCaptured(payload)) {
      const orderStatus = getPaypalOrderStatus(payload) ?? "unknown";
      const failureReason = `PayPal capture response missing completed capture (order status: ${orderStatus})`;
      this.logger.warn(
        JSON.stringify({
          message: "paypal.capture.incomplete",
          environment: resolved.environment ?? "sandbox",
          orderId: providerReference,
          httpStatus: response.status,
          orderStatus,
        }),
      );
      return {
        providerReference,
        status: PaymentStatus.FAILED,
        failureReason,
        rawResponse: payload,
      };
    }

    const captureId = extractPaypalCaptureId(payload, providerReference);
    this.logger.log(
      JSON.stringify({
        message: "paypal.capture.succeeded",
        environment: resolved.environment ?? "sandbox",
        orderId: providerReference,
        captureId,
      }),
    );

    return {
      providerReference: captureId ?? providerReference,
      status: PaymentStatus.SUCCESS,
      rawResponse: payload,
    };
  }

  private async resolveAlreadyCapturedOrder(
    credentials: ProviderCredentials,
    orderId: string,
    issue?: string,
  ): Promise<ProviderPaymentResult> {
    const orderStatus = await this.getPaymentStatus(credentials, orderId);
    if (isPaypalOrderCaptured(orderStatus.rawResponse)) {
      const captureId = extractPaypalCaptureId(orderStatus.rawResponse, orderId);
      this.logger.log(
        JSON.stringify({
          message: "paypal.capture.already_completed",
          environment: credentials.environment ?? "sandbox",
          orderId,
          captureId,
          issue,
        }),
      );
      return {
        providerReference: captureId ?? orderId,
        status: PaymentStatus.SUCCESS,
        rawResponse: orderStatus.rawResponse,
      };
    }

    return {
      providerReference: orderId,
      status: PaymentStatus.FAILED,
      failureReason:
        "PayPal reported the order was already captured, but no completed capture was found on the order",
      rawResponse: orderStatus.rawResponse,
    };
  }

  async refundPayment(
    credentials: ProviderCredentials,
    params: RefundPaymentParams,
  ): Promise<ProviderPaymentResult> {
    const accessToken = await this.getAccessToken(credentials);
    const baseUrl = this.apiBase(credentials);

    const response = await fetch(
      `${baseUrl}/v2/payments/captures/${params.providerReference}/refund`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: {
            currency_code: params.currency.toUpperCase(),
            value: params.amount.toFixed(2),
          },
          note_to_payer: params.reason,
        }),
      },
    );

    const payload = (await response.json()) as {
      id?: string;
      status?: string;
      message?: string;
    };

    if (!response.ok) {
      return {
        providerReference: params.providerReference,
        status: PaymentStatus.FAILED,
        failureReason: payload.message ?? "PayPal refund failed",
        rawResponse: payload,
      };
    }

    return {
      providerReference: payload.id ?? params.providerReference,
      status: PaymentStatus.REFUNDED,
      rawResponse: payload,
    };
  }

  async voidCheckoutOrder(
    credentials: ProviderCredentials,
    orderId: string,
  ): Promise<ProviderPaymentResult> {
    const orderStatus = await this.getPaymentStatus(credentials, orderId);
    const status = (orderStatus.rawResponse as { status?: string } | undefined)?.status?.toUpperCase();

    if (status === "COMPLETED") {
      return {
        providerReference: orderId,
        status: PaymentStatus.FAILED,
        failureReason: "Order is already captured — void is not available",
        rawResponse: orderStatus.rawResponse,
      };
    }

    if (status === "VOIDED") {
      return {
        providerReference: orderId,
        status: PaymentStatus.FAILED,
        rawResponse: orderStatus.rawResponse,
      };
    }

    if (status === "CREATED") {
      return {
        providerReference: orderId,
        status: PaymentStatus.FAILED,
        failureReason: "Order was not approved — no authorization to void (order will expire)",
        rawResponse: orderStatus.rawResponse,
      };
    }

    const authorizationId = extractPaypalAuthorizationId(orderStatus.rawResponse);
    if (!authorizationId) {
      return {
        providerReference: orderId,
        status: PaymentStatus.FAILED,
        failureReason: "No PayPal authorization found on this order",
        rawResponse: orderStatus.rawResponse,
      };
    }

    const accessToken = await this.getAccessToken(credentials);
    const baseUrl = this.apiBase(credentials);

    const response = await fetch(`${baseUrl}/v2/payments/authorizations/${authorizationId}/void`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const payload = (await response.json()) as {
      id?: string;
      status?: string;
      message?: string;
    };

    if (!response.ok) {
      return {
        providerReference: orderId,
        status: PaymentStatus.FAILED,
        failureReason: payload.message ?? "PayPal void failed",
        rawResponse: payload,
      };
    }

    return {
      providerReference: payload.id ?? authorizationId,
      status: PaymentStatus.FAILED,
      rawResponse: payload,
    };
  }

  async getPaymentStatus(
    credentials: ProviderCredentials,
    providerReference: string,
  ): Promise<ProviderPaymentResult> {
    const accessToken = await this.getAccessToken(credentials);
    const baseUrl = this.apiBase(credentials);

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${providerReference}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const payload = (await response.json()) as {
      id?: string;
      status?: string;
      message?: string;
    };

    if (!response.ok) {
      return {
        providerReference,
        status: PaymentStatus.FAILED,
        failureReason: payload.message ?? "PayPal status lookup failed",
        rawResponse: payload,
      };
    }

    return {
      providerReference: payload.id ?? providerReference,
      status: this.mapPaypalStatus(payload.status),
      rawResponse: payload,
    };
  }

  resolveCaptureIdFromCaptureResponse(rawResponse: unknown, fallback?: string): string {
    return extractPaypalCaptureId(rawResponse, fallback) ?? fallback ?? "";
  }

  async verifyWebhookSignature(
    credentials: ProviderCredentials,
    input: {
      webhookId: string;
      authAlgo: string;
      certUrl: string;
      transmissionId: string;
      transmissionSig: string;
      transmissionTime: string;
      webhookEvent: unknown;
    },
  ): Promise<boolean> {
    const resolved = this.resolveCredentials(credentials);
    const accessToken = await this.getAccessToken(resolved);
    const baseUrl = this.apiBase(resolved);

    const response = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: input.authAlgo,
        cert_url: input.certUrl,
        transmission_id: input.transmissionId,
        transmission_sig: input.transmissionSig,
        transmission_time: input.transmissionTime,
        webhook_id: input.webhookId,
        webhook_event: input.webhookEvent,
      }),
    });

    const payload = (await response.json()) as { verification_status?: string };
    return payload.verification_status === "SUCCESS";
  }

  private oauthCacheKey(credentials: ProviderCredentials): string {
    const environment = this.resolveEnvironment(credentials);
    return `${environment}:${credentials.client_id ?? ""}`;
  }

  private async getAccessToken(credentials: ProviderCredentials): Promise<string> {
    const key = this.oauthCacheKey(credentials);
    const cached = this.oauthTokenCache.get(key);
    const skewMs = 60_000;
    if (cached && cached.expiresAtMs > Date.now() + skewMs) {
      return cached.accessToken;
    }

    const issued = await this.issueAccessToken(credentials);
    const ttlMs = Math.max((issued.expiresInSec - 120) * 1000, 60_000);
    this.oauthTokenCache.set(key, {
      accessToken: issued.accessToken,
      expiresAtMs: Date.now() + ttlMs,
    });
    return issued.accessToken;
  }

  private async issueAccessToken(credentials: ProviderCredentials): Promise<{
    accessToken: string;
    scope: string;
    latencyMs: number;
    expiresInSec: number;
  }> {
    const clientId = credentials.client_id;
    const clientSecret = credentials.client_secret;
    if (!clientId || !clientSecret) {
      throw new BadRequestException("PayPal gateway requires client_id and client_secret");
    }

    const started = Date.now();
    const baseUrl = this.apiBase(credentials);
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const payload = (await response.json()) as {
      access_token?: string;
      scope?: string;
      expires_in?: number;
      error_description?: string;
      error?: string;
    };

    const latencyMs = Date.now() - started;

    if (!response.ok || !payload.access_token) {
      const reason =
        payload.error_description ??
        payload.error ??
        `PayPal OAuth failed (${response.status})`;
      throw new BadRequestException(reason);
    }

    return {
      accessToken: payload.access_token,
      scope: payload.scope ?? "",
      latencyMs,
      expiresInSec: typeof payload.expires_in === "number" ? payload.expires_in : 32_400,
    };
  }

  private async probeOrdersApi(
    credentials: ProviderCredentials,
    accessToken: string,
    currency: string,
  ): Promise<{ ok: boolean; message?: string; orderId?: string }> {
    const baseUrl = this.apiBase(credentials);
    const reference = `health-${Date.now()}`;

    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: reference,
            description: "FleetNexus gateway health probe",
            amount: {
              currency_code: currency.toUpperCase(),
              value: "1.00",
            },
          },
        ],
      }),
    });

    const payload = (await response.json()) as {
      id?: string;
      status?: string;
      message?: string;
      details?: Array<{ issue?: string; description?: string }>;
    };

    if (response.ok && payload.id) {
      return {
        ok: true,
        orderId: payload.id,
        message: `Order created (${payload.status ?? "CREATED"})`,
      };
    }

    const detail = payload.details?.[0];
    const message =
      detail?.description ??
      payload.message ??
      `Orders API rejected probe (${response.status})`;

    return { ok: false, message };
  }

  private async probeCaptureApi(
    credentials: ProviderCredentials,
    accessToken: string,
    orderId: string,
  ): Promise<{ ok: boolean; message?: string }> {
    const baseUrl = this.apiBase(credentials);

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const payload = (await response.json()) as {
      name?: string;
      message?: string;
      details?: Array<{ issue?: string; description?: string }>;
    };

    if (response.ok) {
      return { ok: true, message: "Capture API responded successfully" };
    }

    if (response.status === 403) {
      return {
        ok: false,
        message: payload.message ?? "Capture API forbidden — insufficient OAuth scopes",
      };
    }

    if (response.status === 404) {
      return {
        ok: false,
        message: payload.message ?? "Capture endpoint not found",
      };
    }

    const issue = payload.details?.[0]?.issue;
    if (
      response.status === 422 &&
      (issue === "ORDER_NOT_APPROVED" ||
        issue === "PAYER_ACTION_REQUIRED" ||
        payload.name === "UNPROCESSABLE_ENTITY")
    ) {
      return {
        ok: true,
        message: "Capture API reachable (order not approved — expected for health probe)",
      };
    }

    return {
      ok: false,
      message:
        payload.details?.[0]?.description ??
        payload.message ??
        `Capture API probe failed (${response.status})`,
    };
  }

  private evaluateCardProcessingScopes(scope: string): boolean {
    if (!scope.trim()) return false;
    const normalized = scope.toLowerCase();
    return PAYPAL_CARD_SCOPES.some((required) => normalized.includes(required.toLowerCase()));
  }

  private resolveProbeCurrency(settings?: Record<string, unknown> | null): string {
    const fromSettings = settings?.default_currency ?? settings?.currency;
    if (typeof fromSettings === "string" && /^[A-Z]{3}$/i.test(fromSettings.trim())) {
      return fromSettings.trim().toUpperCase();
    }
    const supported = settings?.supported_currencies;
    if (Array.isArray(supported) && typeof supported[0] === "string") {
      return supported[0].toUpperCase();
    }
    return "USD";
  }

  apiBase(credentials: ProviderCredentials): string {
    return credentials.environment === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";
  }

  private mapPaypalStatus(status?: string): PaymentStatus {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return PaymentStatus.SUCCESS;
      case "APPROVED":
      case "PAYER_ACTION_REQUIRED":
        return PaymentStatus.PROCESSING;
      case "VOIDED":
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}
