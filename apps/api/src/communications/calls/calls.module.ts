import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { RealtimeModule } from "../../realtime/realtime.module";
import { VonageWebhookValidationFilter } from "../vonage/filters/vonage-webhook-validation.filter";
import { VonageWebhookAuditInterceptor } from "../vonage/interceptors/vonage-webhook-audit.interceptor";
import { TelnyxModule } from "../telnyx/telnyx.module";
import { VonageModule } from "../vonage/vonage.module";
import { CallCenterMetricsService } from "./call-center-metrics.service";
import { CallCustomerLookupService } from "./call-customer-lookup.service";
import { CallDispositionService } from "./call-disposition.service";
import { CallStateManagerService } from "./call-state-manager.service";
import {
  CallsController,
  CallsWebhooksController,
  TelnyxWebhooksController,
} from "./calls.controller";
import { CallsService } from "./calls.service";
import { InboundCallOrchestratorService } from "./inbound-call-orchestrator.service";
import { TelnyxWebhookAuditInterceptor } from "../telnyx/interceptors/telnyx-webhook-audit.interceptor";

@Module({
  imports: [PrismaModule, RealtimeModule, VonageModule, TelnyxModule],
  controllers: [CallsController, CallsWebhooksController, TelnyxWebhooksController],
  providers: [
    CallsService,
    CallStateManagerService,
    CallCustomerLookupService,
    InboundCallOrchestratorService,
    CallCenterMetricsService,
    CallDispositionService,
    VonageWebhookAuditInterceptor,
    VonageWebhookValidationFilter,
    TelnyxWebhookAuditInterceptor,
  ],
  exports: [CallsService, CallStateManagerService, CallCenterMetricsService],
})
export class CallsModule {}
