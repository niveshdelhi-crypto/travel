import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { PaymentGatewayType, PaymentStatus } from "@prisma/client";
import type {
  CreatePaymentParams,
  PaymentProviderStrategy,
  ProviderCredentials,
  ProviderPaymentResult,
  RefundPaymentParams,
} from "./payment-provider.interface";

@Injectable()
export class PaypalPaymentProvider implements PaymentProviderStrategy {
  readonly gatewayType = PaymentGatewayType.paypal;
  private readonly logger = new Logger(PaypalPaymentProvider.name);

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
      const message = payload.message ?? "PayPal order creation failed";
      this.logger.warn(JSON.stringify({ message: "paypal.create.failed", error: message }));
      return {
        providerReference: params.reference,
        status: PaymentStatus.FAILED,
        failureReason: message,
        rawResponse: payload,
      };
    }

    const approveLink = payload.links?.find((link) => link.rel === "approve");

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
    const accessToken = await this.getAccessToken(credentials);
    const baseUrl = this.apiBase(credentials);

    const response = await fetch(
      `${baseUrl}/v2/checkout/orders/${providerReference}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const payload = (await response.json()) as {
      id?: string;
      status?: string;
      message?: string;
    };

    if (!response.ok) {
      return {
        providerReference,
        status: PaymentStatus.FAILED,
        failureReason: payload.message ?? "PayPal capture failed",
        rawResponse: payload,
      };
    }

    return {
      providerReference: payload.id ?? providerReference,
      status: this.mapPaypalStatus(payload.status),
      rawResponse: payload,
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

  private async getAccessToken(credentials: ProviderCredentials): Promise<string> {
    const clientId = credentials.client_id;
    const clientSecret = credentials.client_secret;
    if (!clientId || !clientSecret) {
      throw new BadRequestException("PayPal gateway requires client_id and client_secret");
    }

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

    const payload = (await response.json()) as { access_token?: string; error_description?: string };
    if (!response.ok || !payload.access_token) {
      throw new BadRequestException(payload.error_description ?? "PayPal authentication failed");
    }

    return payload.access_token;
  }

  private apiBase(credentials: ProviderCredentials): string {
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
