import type { PaymentGatewayType } from "@prisma/client";
import type { ProviderCredentials, ProviderPaymentResult } from "../../providers/payment-provider.interface";

export type CheckoutOrderParams = {
  amount: number;
  currency: string;
  reference: string;
  description?: string;
  sessionId: string;
};

export type CheckoutPublicConfig = {
  gatewayType: PaymentGatewayType;
  checkoutMode: string;
  clientId?: string;
  environment?: "sandbox" | "live";
  currency: string;
  amount: number;
  publishableKey?: string;
  supported: boolean;
  message?: string;
};

export type CheckoutOrderResult = {
  orderId: string;
  status: string;
  approveUrl?: string;
  rawResponse?: unknown;
};

export interface CheckoutGatewayAdapter {
  readonly gatewayType: PaymentGatewayType;
  readonly checkoutMode: string;
  getPublicConfig(
    credentials: ProviderCredentials,
    settings: Record<string, unknown> | null,
    params: { amount: number; currency: string },
  ): CheckoutPublicConfig;
  createOrder(
    credentials: ProviderCredentials,
    params: CheckoutOrderParams,
  ): Promise<CheckoutOrderResult>;
  captureOrder(
    credentials: ProviderCredentials,
    orderId: string,
  ): Promise<ProviderPaymentResult>;
  healthCheck(credentials: ProviderCredentials): Promise<{ healthy: boolean; latencyMs: number; message?: string }>;
}

export const CHECKOUT_GATEWAY_ADAPTERS = Symbol("CHECKOUT_GATEWAY_ADAPTERS");
