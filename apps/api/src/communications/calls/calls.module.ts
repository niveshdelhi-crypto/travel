import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { RealtimeModule } from "../../realtime/realtime.module";
import { VonageWebhookValidationFilter } from "../vonage/filters/vonage-webhook-validation.filter";
import { VonageWebhookAuditInterceptor } from "../vonage/interceptors/vonage-webhook-audit.interceptor";
import { VonageModule } from "../vonage/vonage.module";
import { CallStateManagerService } from "./call-state-manager.service";
import { CallsController, CallsWebhooksController } from "./calls.controller";
import { CallsService } from "./calls.service";

@Module({
  imports: [PrismaModule, RealtimeModule, VonageModule],
  controllers: [CallsController, CallsWebhooksController],
  providers: [
    CallsService,
    CallStateManagerService,
    VonageWebhookAuditInterceptor,
    VonageWebhookValidationFilter,
  ],
  exports: [CallsService, CallStateManagerService],
})
export class CallsModule {}
