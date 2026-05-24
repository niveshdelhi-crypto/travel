import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { CallsModule } from "./calls/calls.module";
import { CallsWebhooksController } from "./calls/calls.controller";
import { VonageWebhookIpMiddleware } from "./vonage/middleware/vonage-webhook-ip.middleware";
import { VonageModule } from "./vonage/vonage.module";

@Module({
  imports: [VonageModule, CallsModule],
  exports: [VonageModule, CallsModule],
})
export class CommunicationsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(VonageWebhookIpMiddleware).forRoutes(CallsWebhooksController);
  }
}
