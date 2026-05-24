import { Global, Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { VonageReplayCacheService } from "./vonage-replay-cache.service";
import { VonageService } from "./vonage.service";
import { VonageSignatureService } from "./vonage-signature.service";
import { VonageWebhookGuard } from "./vonage-webhook.guard";
import { WebhookRequestLogService } from "./webhook-request-log.service";

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    VonageService,
    VonageSignatureService,
    VonageReplayCacheService,
    VonageWebhookGuard,
    WebhookRequestLogService,
  ],
  exports: [
    VonageService,
    VonageSignatureService,
    VonageReplayCacheService,
    VonageWebhookGuard,
    WebhookRequestLogService,
  ],
})
export class VonageModule {}
