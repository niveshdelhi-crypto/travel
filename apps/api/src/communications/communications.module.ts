import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { CallsModule } from "./calls/calls.module";
import { CallsWebhooksController, TelnyxWebhooksController } from "./calls/calls.controller";
import { TelnyxWebhookIpMiddleware } from "./telnyx/middleware/telnyx-webhook-ip.middleware";
import { TelnyxModule } from "./telnyx/telnyx.module";
import { VonageWebhookIpMiddleware } from "./vonage/middleware/vonage-webhook-ip.middleware";
import { VonageModule } from "./vonage/vonage.module";

@Module({
  imports: [VonageModule, TelnyxModule, CallsModule],
  exports: [VonageModule, TelnyxModule, CallsModule],
})
export class CommunicationsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(VonageWebhookIpMiddleware).forRoutes(CallsWebhooksController);
    consumer.apply(TelnyxWebhookIpMiddleware).forRoutes(TelnyxWebhooksController);
  }
}
