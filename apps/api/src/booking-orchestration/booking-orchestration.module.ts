import { Module, forwardRef } from "@nestjs/common";
import { PaymentsModule } from "../payments/payments.module";
import { PaymentSessionsModule } from "../payments/payment-sessions/payment-sessions.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { BookingOperationsController } from "./controllers/booking-operations.controller";
import { BookingJobProcessorService } from "./services/booking-job-processor.service";
import { BookingLifecycleService } from "./services/booking-lifecycle.service";
import { BookingOrchestrationService } from "./services/booking-orchestration.service";
import { DocumentStorageService } from "./services/document-storage.service";
import { FinanceDashboardService } from "./services/finance-dashboard.service";
import { InvoiceVoucherService } from "./services/invoice-voucher.service";
import { PaymentVaultService } from "./services/payment-vault.service";
import { RefundWorkflowService } from "./services/refund-workflow.service";
import { SupplierBookingService } from "./services/supplier-booking.service";
import { TravelersService } from "./services/travelers.service";

@Module({
  imports: [
    PrismaModule,
    RealtimeModule,
    forwardRef(() => PaymentsModule),
    forwardRef(() => PaymentSessionsModule),
  ],
  controllers: [BookingOperationsController],
  providers: [
    BookingLifecycleService,
    BookingOrchestrationService,
    TravelersService,
    PaymentVaultService,
    SupplierBookingService,
    InvoiceVoucherService,
    DocumentStorageService,
    RefundWorkflowService,
    FinanceDashboardService,
    BookingJobProcessorService,
  ],
  exports: [
    BookingLifecycleService,
    BookingOrchestrationService,
    TravelersService,
    BookingJobProcessorService,
  ],
})
export class BookingOrchestrationModule {}
