import { Injectable } from "@nestjs/common";
import { PaymentGatewayType } from "@prisma/client";
import type { ProviderCredentials, ProviderPaymentResult } from "../../../providers/payment-provider.interface";
import type {
  CheckoutGatewayAdapter,
  CheckoutOrderParams,
  CheckoutOrderResult,
  CheckoutPublicConfig,
} from "../checkout-gateway.interface";

@Injectable()
export class WiseCheckoutAdapter implements CheckoutGatewayAdapter {
  readonly gatewayType = PaymentGatewayType.wise;
  readonly checkoutMode = "wise_transfer";

  getPublicConfig(
    _credentials: ProviderCredentials,
    _settings: Record<string, unknown> | null,
    params: { amount: number; currency: string },
  ): CheckoutPublicConfig {
    return {
      gatewayType: this.gatewayType,
      checkoutMode: this.checkoutMode,
      currency: params.currency,
      amount: params.amount,
      supported: false,
      message: "Wise checkout will be available in a future release",
    };
  }

  async createOrder(_credentials: ProviderCredentials, _params: CheckoutOrderParams): Promise<CheckoutOrderResult> {
    throw new Error("Wise checkout is not yet implemented");
  }

  async captureOrder(_credentials: ProviderCredentials, _orderId: string): Promise<ProviderPaymentResult> {
    throw new Error("Wise checkout is not yet implemented");
  }

  async healthCheck(_credentials: ProviderCredentials) {
    return { healthy: false, latencyMs: 0, message: "Wise checkout adapter pending" };
  }
}
