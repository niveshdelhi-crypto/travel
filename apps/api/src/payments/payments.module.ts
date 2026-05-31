import { MiddlewareConsumer, Module, NestModule, forwardRef } from "@nestjs/common";
import { BookingsModule } from "../bookings/bookings.module";
import { BookingOrchestrationModule } from "../booking-orchestration/booking-orchestration.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { BookingPaymentRequestsController } from "./controllers/booking-payment-requests.controller";
import { LedgerPaymentsController } from "./controllers/ledger-payments.controller";
import { PaymentAuditLogsController } from "./controllers/payment-audit-logs.controller";
import { PaymentGatewayHealthController } from "./controllers/payment-gateway-health.controller";
import {
  PaymentAdminController,
  PaymentGatewaysController,
} from "./controllers/payment-gateways.controller";
import { PaymentTestingController } from "./controllers/payment-testing.controller";
import { PaymentTransactionsController } from "./controllers/payment-transactions.controller";
import { CredentialsCryptoService } from "./crypto/credentials-crypto.service";
import { PaymentAuditMiddleware } from "./middleware/payment-audit.middleware";
import { PaymentSessionsController } from "./payment-sessions/payment-sessions.controller";
import { PaymentSessionsModule } from "./payment-sessions/payment-sessions.module";
import { PaypalPaymentProvider } from "./providers/paypal.provider";
import { StripePaymentProvider } from "./providers/stripe.provider";
import { WisePaymentProvider } from "./providers/wise.provider";
import { AuditLogService } from "./services/audit-log.service";
import { BookingPaymentWorkflowService } from "./services/booking-payment-workflow.service";
import { GatewayRegistryService } from "./services/gateway-registry.service";
import { GatewayHealthService } from "./services/gateway-health.service";
import { PaymentGatewayAdminService } from "./services/payment-gateway-admin.service";
import { PaymentTestingService } from "./services/payment-testing.service";
import { PaymentTransactionService } from "./services/payment-transaction.service";

@Module({
  imports: [PrismaModule, RealtimeModule, BookingsModule, forwardRef(() => BookingOrchestrationModule), forwardRef(() => PaymentSessionsModule)],
  controllers: [
    PaymentGatewayHealthController,
    PaymentGatewaysController,
    PaymentAdminController,
    PaymentTransactionsController,
    PaymentTestingController,
    BookingPaymentRequestsController,
    PaymentAuditLogsController,
    LedgerPaymentsController,
  ],
  providers: [
    CredentialsCryptoService,
    StripePaymentProvider,
    PaypalPaymentProvider,
    WisePaymentProvider,
    GatewayRegistryService,
    PaymentTransactionService,
    PaymentTestingService,
    BookingPaymentWorkflowService,
    PaymentGatewayAdminService,
    GatewayHealthService,
    AuditLogService,
    PaymentAuditMiddleware,
  ],
  exports: [
    GatewayRegistryService,
    PaymentTransactionService,
    BookingPaymentWorkflowService,
    AuditLogService,
    CredentialsCryptoService,
    PaypalPaymentProvider,
    StripePaymentProvider,
    WisePaymentProvider,
    GatewayHealthService,
  ],
})
export class PaymentsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PaymentAuditMiddleware).forRoutes(
      PaymentGatewayHealthController,
      PaymentGatewaysController,
      PaymentAdminController,
      PaymentTransactionsController,
      BookingPaymentRequestsController,
      PaymentAuditLogsController,
      LedgerPaymentsController,
      PaymentSessionsController,
      PaymentTestingController,
    );
  }
}
