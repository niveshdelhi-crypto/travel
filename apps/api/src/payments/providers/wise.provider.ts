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
export class WisePaymentProvider implements PaymentProviderStrategy {
  readonly gatewayType = PaymentGatewayType.wise;
  private readonly logger = new Logger(WisePaymentProvider.name);

  async createPayment(
    credentials: ProviderCredentials,
    params: CreatePaymentParams,
  ): Promise<ProviderPaymentResult> {
    const apiToken = credentials.api_token;
    const profileId = credentials.profile_id;
    if (!apiToken || !profileId) {
      throw new BadRequestException("Wise gateway requires api_token and profile_id credentials");
    }

    const quote = await this.createQuote(credentials, params);
    if (!quote.quoteId) {
      return {
        providerReference: params.reference,
        status: PaymentStatus.FAILED,
        failureReason: quote.failureReason ?? "Wise quote creation failed",
        rawResponse: quote.rawResponse,
      };
    }

    const transfer = await this.createTransfer(credentials, quote.quoteId, params.reference);
    if (!transfer.providerReference) {
      return {
        providerReference: params.reference,
        status: PaymentStatus.FAILED,
        failureReason: transfer.failureReason ?? "Wise transfer creation failed",
        rawResponse: transfer.rawResponse,
      };
    }

    return {
      providerReference: transfer.providerReference,
      status: PaymentStatus.PROCESSING,
      rawResponse: transfer.rawResponse,
    };
  }

  async capturePayment(
    credentials: ProviderCredentials,
    providerReference: string,
  ): Promise<ProviderPaymentResult> {
    return this.getPaymentStatus(credentials, providerReference);
  }

  async refundPayment(
    credentials: ProviderCredentials,
    params: RefundPaymentParams,
  ): Promise<ProviderPaymentResult> {
    this.logger.warn(
      JSON.stringify({
        message: "wise.refund.not_supported",
        providerReference: params.providerReference,
      }),
    );

    return {
      providerReference: params.providerReference,
      status: PaymentStatus.FAILED,
      failureReason: "Wise refunds must be initiated manually in the Wise dashboard",
    };
  }

  async getPaymentStatus(
    credentials: ProviderCredentials,
    providerReference: string,
  ): Promise<ProviderPaymentResult> {
    const apiToken = credentials.api_token;
    if (!apiToken) {
      throw new BadRequestException("Wise gateway requires api_token credential");
    }

    const response = await fetch(
      `https://api.transferwise.com/v1/transfers/${providerReference}`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const payload = (await response.json()) as {
      id?: number;
      status?: string;
      message?: string;
    };

    if (!response.ok) {
      return {
        providerReference,
        status: PaymentStatus.FAILED,
        failureReason: payload.message ?? "Wise transfer lookup failed",
        rawResponse: payload,
      };
    }

    return {
      providerReference: String(payload.id ?? providerReference),
      status: this.mapWiseStatus(payload.status),
      rawResponse: payload,
    };
  }

  private async createQuote(
    credentials: ProviderCredentials,
    params: CreatePaymentParams,
  ): Promise<{ quoteId?: string; failureReason?: string; rawResponse?: unknown }> {
    const apiToken = credentials.api_token;
    const profileId = credentials.profile_id;

    const response = await fetch("https://api.transferwise.com/v3/profiles/" + profileId + "/quotes", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceCurrency: params.currency.toUpperCase(),
        targetCurrency: params.currency.toUpperCase(),
        sourceAmount: params.amount,
        profile: Number(profileId),
      }),
    });

    const payload = (await response.json()) as { id?: string; message?: string };
    if (!response.ok) {
      this.logger.warn(JSON.stringify({ message: "wise.quote.failed", error: payload.message }));
      return { failureReason: payload.message, rawResponse: payload };
    }

    return { quoteId: payload.id, rawResponse: payload };
  }

  private async createTransfer(
    credentials: ProviderCredentials,
    quoteId: string,
    reference: string,
  ): Promise<{
    providerReference?: string;
    failureReason?: string;
    rawResponse?: unknown;
  }> {
    const apiToken = credentials.api_token;
    const profileId = credentials.profile_id;
    const targetAccountId = credentials.target_account_id;

    if (!targetAccountId) {
      return { failureReason: "Wise gateway requires target_account_id credential" };
    }

    const response = await fetch("https://api.transferwise.com/v1/transfers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targetAccount: Number(targetAccountId),
        quoteUuid: quoteId,
        customerTransactionId: reference,
        details: { reference },
        profile: Number(profileId),
      }),
    });

    const payload = (await response.json()) as { id?: number; message?: string };
    if (!response.ok) {
      this.logger.warn(JSON.stringify({ message: "wise.transfer.failed", error: payload.message }));
      return { failureReason: payload.message, rawResponse: payload };
    }

    return { providerReference: String(payload.id), rawResponse: payload };
  }

  private mapWiseStatus(status?: string): PaymentStatus {
    switch (status?.toLowerCase()) {
      case "outgoing_payment_sent":
      case "funds_converted":
      case "completed":
        return PaymentStatus.SUCCESS;
      case "processing":
      case "incoming_payment_waiting":
      case "waiting_recipient_input_to_proceed":
        return PaymentStatus.PROCESSING;
      case "cancelled":
      case "bounced_back":
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}
