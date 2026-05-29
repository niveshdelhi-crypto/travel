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
export class StripePaymentProvider implements PaymentProviderStrategy {
  readonly gatewayType = PaymentGatewayType.stripe;
  private readonly logger = new Logger(StripePaymentProvider.name);

  async createPayment(
    credentials: ProviderCredentials,
    params: CreatePaymentParams,
  ): Promise<ProviderPaymentResult> {
    const secretKey = credentials.secret_key;
    if (!secretKey) {
      throw new BadRequestException("Stripe gateway requires secret_key credential");
    }

    const body = new URLSearchParams({
      amount: String(Math.round(params.amount * 100)),
      currency: params.currency.toLowerCase(),
      "metadata[reference]": params.reference,
      ...(params.description ? { description: params.description } : {}),
    });

    const response = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const payload = (await response.json()) as {
      id?: string;
      status?: string;
      client_secret?: string;
      last_payment_error?: { message?: string };
      error?: { message?: string };
    };

    if (!response.ok) {
      const message = payload.error?.message ?? "Stripe payment intent creation failed";
      this.logger.warn(JSON.stringify({ message: "stripe.create.failed", error: message }));
      return {
        providerReference: params.reference,
        status: PaymentStatus.FAILED,
        failureReason: message,
        rawResponse: payload,
      };
    }

    return {
      providerReference: payload.id ?? params.reference,
      status: this.mapStripeStatus(payload.status),
      checkoutUrl: payload.client_secret ? undefined : undefined,
      rawResponse: payload,
    };
  }

  async capturePayment(
    credentials: ProviderCredentials,
    providerReference: string,
  ): Promise<ProviderPaymentResult> {
    const secretKey = credentials.secret_key;
    if (!secretKey) {
      throw new BadRequestException("Stripe gateway requires secret_key credential");
    }

    const response = await fetch(
      `https://api.stripe.com/v1/payment_intents/${providerReference}/capture`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${secretKey}` },
      },
    );

    const payload = (await response.json()) as {
      id?: string;
      status?: string;
      error?: { message?: string };
    };

    if (!response.ok) {
      return {
        providerReference,
        status: PaymentStatus.FAILED,
        failureReason: payload.error?.message ?? "Stripe capture failed",
        rawResponse: payload,
      };
    }

    return {
      providerReference: payload.id ?? providerReference,
      status: this.mapStripeStatus(payload.status),
      rawResponse: payload,
    };
  }

  async refundPayment(
    credentials: ProviderCredentials,
    params: RefundPaymentParams,
  ): Promise<ProviderPaymentResult> {
    const secretKey = credentials.secret_key;
    if (!secretKey) {
      throw new BadRequestException("Stripe gateway requires secret_key credential");
    }

    const body = new URLSearchParams({
      payment_intent: params.providerReference,
      amount: String(Math.round(params.amount * 100)),
      ...(params.reason ? { reason: "requested_by_customer" } : {}),
    });

    const response = await fetch("https://api.stripe.com/v1/refunds", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const payload = (await response.json()) as {
      id?: string;
      status?: string;
      error?: { message?: string };
    };

    if (!response.ok) {
      return {
        providerReference: params.providerReference,
        status: PaymentStatus.FAILED,
        failureReason: payload.error?.message ?? "Stripe refund failed",
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
    const secretKey = credentials.secret_key;
    if (!secretKey) {
      throw new BadRequestException("Stripe gateway requires secret_key credential");
    }

    const response = await fetch(
      `https://api.stripe.com/v1/payment_intents/${providerReference}`,
      {
        headers: { Authorization: `Bearer ${secretKey}` },
      },
    );

    const payload = (await response.json()) as {
      id?: string;
      status?: string;
      error?: { message?: string };
    };

    if (!response.ok) {
      return {
        providerReference,
        status: PaymentStatus.FAILED,
        failureReason: payload.error?.message ?? "Stripe status lookup failed",
        rawResponse: payload,
      };
    }

    return {
      providerReference: payload.id ?? providerReference,
      status: this.mapStripeStatus(payload.status),
      rawResponse: payload,
    };
  }

  private mapStripeStatus(status?: string): PaymentStatus {
    switch (status) {
      case "succeeded":
        return PaymentStatus.SUCCESS;
      case "processing":
      case "requires_action":
      case "requires_confirmation":
      case "requires_capture":
        return PaymentStatus.PROCESSING;
      case "canceled":
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}
