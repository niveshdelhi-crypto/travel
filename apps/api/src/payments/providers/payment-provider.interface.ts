import type { PaymentGatewayType, PaymentStatus } from "@prisma/client";

export type ProviderCredentials = Record<string, string>;

export type CreatePaymentParams = {
  amount: number;
  currency: string;
  reference: string;
  description?: string;
  metadata?: Record<string, unknown>;
  returnUrl?: string;
  cancelUrl?: string;
};

export type RefundPaymentParams = {
  providerReference: string;
  amount: number;
  currency: string;
  reason?: string;
};

export type ProviderPaymentResult = {
  providerReference: string;
  status: PaymentStatus;
  checkoutUrl?: string;
  rawResponse?: unknown;
  failureReason?: string;
};

export interface PaymentProviderStrategy {
  readonly gatewayType: PaymentGatewayType;
  createPayment(
    credentials: ProviderCredentials,
    params: CreatePaymentParams,
  ): Promise<ProviderPaymentResult>;
  capturePayment(
    credentials: ProviderCredentials,
    providerReference: string,
  ): Promise<ProviderPaymentResult>;
  refundPayment(
    credentials: ProviderCredentials,
    params: RefundPaymentParams,
  ): Promise<ProviderPaymentResult>;
  getPaymentStatus(
    credentials: ProviderCredentials,
    providerReference: string,
  ): Promise<ProviderPaymentResult>;
}

export const PAYMENT_PROVIDER_STRATEGIES = Symbol("PAYMENT_PROVIDER_STRATEGIES");
