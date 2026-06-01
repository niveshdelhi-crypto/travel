import { Injectable, Logger } from "@nestjs/common";
import { PaymentGatewayType, PaymentStatus } from "@prisma/client";
import type { ProviderCredentials, ProviderPaymentResult } from "../../../providers/payment-provider.interface";
import { PaypalPaymentProvider } from "../../../providers/paypal.provider";
import type {
  CheckoutGatewayAdapter,
  CheckoutOrderParams,
  CheckoutOrderResult,
  CheckoutPublicConfig,
} from "../checkout-gateway.interface";

@Injectable()
export class PaypalCheckoutAdapter implements CheckoutGatewayAdapter {
  readonly gatewayType = PaymentGatewayType.paypal;
  readonly checkoutMode = "paypal_smart_checkout";
  private readonly logger = new Logger(PaypalCheckoutAdapter.name);

  constructor(private readonly paypal: PaypalPaymentProvider) {}

  getPublicConfig(
    credentials: ProviderCredentials,
    settings: Record<string, unknown> | null,
    params: { amount: number; currency: string },
  ): CheckoutPublicConfig {
    const resolved = this.paypal.resolveCredentials(credentials, settings);
    const clientId = resolved.client_id;
    const environment = this.paypal.resolveEnvironment(resolved, settings);

    if (!clientId) {
      return {
        gatewayType: this.gatewayType,
        checkoutMode: this.checkoutMode,
        currency: params.currency,
        amount: params.amount,
        supported: false,
        message: "PayPal client_id is not configured for this gateway",
      };
    }

    return {
      gatewayType: this.gatewayType,
      checkoutMode: this.checkoutMode,
      clientId,
      environment,
      currency: params.currency,
      amount: params.amount,
      supported: true,
    };
  }

  async createOrder(
    credentials: ProviderCredentials,
    params: CheckoutOrderParams,
  ): Promise<CheckoutOrderResult> {
    const result = await this.paypal.createPayment(credentials, {
      amount: params.amount,
      currency: params.currency,
      reference: params.reference,
      description: params.description ?? `Fleet Nexus booking payment ${params.sessionId.slice(0, 8)}`,
      metadata: { sessionId: params.sessionId, checkoutMode: this.checkoutMode },
    });

    if (result.status === PaymentStatus.FAILED || !result.providerReference) {
      throw new Error(result.failureReason ?? "PayPal order creation failed");
    }

    return {
      orderId: result.providerReference,
      status: result.status,
      approveUrl: result.checkoutUrl,
      rawResponse: result.rawResponse,
    };
  }

  async captureOrder(
    credentials: ProviderCredentials,
    orderId: string,
  ): Promise<ProviderPaymentResult> {
    return this.paypal.capturePayment(credentials, orderId);
  }

  async healthCheck(credentials: ProviderCredentials): Promise<{
    healthy: boolean;
    latencyMs: number;
    message?: string;
  }> {
    const diagnostics = await this.paypal.runHealthDiagnostics(credentials, null);
    const healthy =
      diagnostics.oauth_valid &&
      diagnostics.orders_api &&
      diagnostics.capture_api &&
      diagnostics.currency_supported;

    return {
      healthy,
      latencyMs: diagnostics.oauth_latency_ms,
      message: healthy
        ? undefined
        : [
            diagnostics.oauth_message,
            diagnostics.orders_api_message,
            diagnostics.capture_api_message,
            diagnostics.currency_message,
          ]
            .filter(Boolean)
            .join(" · "),
    };
  }

  async probeOAuth(credentials: ProviderCredentials): Promise<{
    healthy: boolean;
    latencyMs: number;
    message?: string;
  }> {
    const diagnostics = await this.paypal.runHealthDiagnostics(credentials, null);
    return {
      healthy: diagnostics.oauth_valid,
      latencyMs: diagnostics.oauth_latency_ms,
      message: diagnostics.oauth_message,
    };
  }
}
