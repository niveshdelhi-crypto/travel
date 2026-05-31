import { Global, Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { WebhookRequestLogService } from "../vonage/webhook-request-log.service";
import { TelnyxReplayCacheService } from "./telnyx-replay-cache.service";
import { TelnyxService } from "./telnyx.service";
import { TelnyxSignatureService } from "./telnyx-signature.service";
import { TelnyxWebhookGuard } from "./telnyx-webhook.guard";

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    TelnyxService,
    TelnyxSignatureService,
    TelnyxReplayCacheService,
    TelnyxWebhookGuard,
    WebhookRequestLogService,
  ],
  exports: [
    TelnyxService,
    TelnyxSignatureService,
    TelnyxReplayCacheService,
    TelnyxWebhookGuard,
    WebhookRequestLogService,
  ],
})
export class TelnyxModule {}
