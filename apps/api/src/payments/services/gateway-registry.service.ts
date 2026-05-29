import { Injectable, NotFoundException } from "@nestjs/common";
import { PaymentGatewayType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CredentialsCryptoService } from "../crypto/credentials-crypto.service";
import type {
  PaymentProviderStrategy,
  ProviderCredentials,
} from "../providers/payment-provider.interface";
import { PaypalPaymentProvider } from "../providers/paypal.provider";
import { StripePaymentProvider } from "../providers/stripe.provider";
import { WisePaymentProvider } from "../providers/wise.provider";

export type ResolvedPaymentGateway = {
  id: string;
  name: string;
  type: PaymentGatewayType;
  isActive: boolean;
  credentials: ProviderCredentials;
  settings: Record<string, unknown> | null;
  provider: PaymentProviderStrategy;
};

@Injectable()
export class GatewayRegistryService {
  private readonly strategyMap: Map<PaymentGatewayType, PaymentProviderStrategy>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CredentialsCryptoService,
    stripeProvider: StripePaymentProvider,
    paypalProvider: PaypalPaymentProvider,
    wiseProvider: WisePaymentProvider,
  ) {
    this.strategyMap = new Map<PaymentGatewayType, PaymentProviderStrategy>([
      [PaymentGatewayType.stripe, stripeProvider],
      [PaymentGatewayType.paypal, paypalProvider],
      [PaymentGatewayType.wise, wiseProvider],
    ]);
  }

  listActiveGatewayTypes(): PaymentGatewayType[] {
    return [...this.strategyMap.keys()];
  }

  getProviderStrategy(type: PaymentGatewayType): PaymentProviderStrategy {
    const strategy = this.strategyMap.get(type);
    if (!strategy) {
      throw new NotFoundException(`No payment provider registered for gateway type ${type}`);
    }
    return strategy;
  }

  async resolveGateway(gatewayId: string): Promise<ResolvedPaymentGateway> {
    const gateway = await this.prisma.paymentGateway.findUnique({ where: { id: gatewayId } });
    if (!gateway) {
      throw new NotFoundException("Payment gateway not found");
    }

    const credentials = this.crypto.decrypt<ProviderCredentials>(gateway.encrypted_credentials);
    const provider = this.getProviderStrategy(gateway.type);

    return {
      id: gateway.id,
      name: gateway.name,
      type: gateway.type,
      isActive: gateway.is_active,
      credentials,
      settings: (gateway.settings as Record<string, unknown> | null) ?? null,
      provider,
    };
  }

  async resolveActiveGatewayByType(type: PaymentGatewayType): Promise<ResolvedPaymentGateway> {
    const gateway = await this.prisma.paymentGateway.findFirst({
      where: { type, is_active: true },
      orderBy: { created_at: "asc" },
    });

    if (!gateway) {
      throw new NotFoundException(`No active payment gateway configured for type ${type}`);
    }

    return this.resolveGateway(gateway.id);
  }
}
