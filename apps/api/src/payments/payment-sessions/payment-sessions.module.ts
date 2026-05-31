import { Module, forwardRef } from "@nestjs/common";
import { BookingOrchestrationModule } from "../../booking-orchestration/booking-orchestration.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { RealtimeModule } from "../../realtime/realtime.module";
import { PaymentsModule } from "../payments.module";
import { PaypalCheckoutAdapter } from "./checkout/adapters/paypal-checkout.adapter";
import { StripeCheckoutAdapter } from "./checkout/adapters/stripe-checkout.adapter";
import { WiseCheckoutAdapter } from "./checkout/adapters/wise-checkout.adapter";
import { CheckoutGatewayRegistry } from "./checkout/checkout-gateway.registry";
import { PaymentSessionCheckoutService } from "./payment-session-checkout.service";
import { PaymentSessionsController } from "./payment-sessions.controller";
import { PaymentSessionsService } from "./payment-sessions.service";

@Module({
  imports: [
    PrismaModule,
    RealtimeModule,
    forwardRef(() => BookingOrchestrationModule),
    forwardRef(() => PaymentsModule),
  ],
  controllers: [PaymentSessionsController],
  providers: [
    PaymentSessionsService,
    PaymentSessionCheckoutService,
    CheckoutGatewayRegistry,
    PaypalCheckoutAdapter,
    StripeCheckoutAdapter,
    WiseCheckoutAdapter,
  ],
  exports: [PaymentSessionsService, PaymentSessionCheckoutService],
})
export class PaymentSessionsModule {}
