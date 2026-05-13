import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "../prisma/prisma.module";
import { RealtimeEventDeduplicator } from "./realtime-event-deduplicator.service";
import { RealtimeGateway } from "./realtime.gateway";

@Module({
  imports: [JwtModule.register({}), PrismaModule],
  providers: [RealtimeGateway, RealtimeEventDeduplicator],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
