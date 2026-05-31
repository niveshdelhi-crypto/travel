import { Injectable, NotFoundException } from "@nestjs/common";
import { PaymentGatewayType } from "@prisma/client";
import { GatewayRegistryService } from "../../services/gateway-registry.service";
import type { CheckoutGatewayAdapter } from "./checkout-gateway.interface";
import { PaypalCheckoutAdapter } from "./adapters/paypal-checkout.adapter";
import { StripeCheckoutAdapter } from "./adapters/stripe-checkout.adapter";
import { WiseCheckoutAdapter } from "./adapters/wise-checkout.adapter";

@Injectable()
export class CheckoutGatewayRegistry {
  private readonly adapterMap: Map<PaymentGatewayType, CheckoutGatewayAdapter>;

  constructor(
    paypalAdapter: PaypalCheckoutAdapter,
    stripeAdapter: StripeCheckoutAdapter,
    wiseAdapter: WiseCheckoutAdapter,
    private readonly gatewayRegistry: GatewayRegistryService,
  ) {
    this.adapterMap = new Map<PaymentGatewayType, CheckoutGatewayAdapter>([
      [PaymentGatewayType.paypal, paypalAdapter],
      [PaymentGatewayType.stripe, stripeAdapter],
      [PaymentGatewayType.wise, wiseAdapter],
    ]);
  }

  getAdapter(type: PaymentGatewayType): CheckoutGatewayAdapter {
    const adapter = this.adapterMap.get(type);
    if (!adapter) {
      throw new NotFoundException(`No checkout adapter registered for gateway type ${type}`);
    }
    return adapter;
  }

  async resolveCheckoutAdapter(gatewayId: string) {
    const gateway = await this.gatewayRegistry.resolveGateway(gatewayId);
    const adapter = this.getAdapter(gateway.type);
    return { gateway, adapter };
  }
}
