import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { BookingsHttpController } from "./bookings.controller";
import { BookingsService } from "./bookings.service";

@Module({
  imports: [PrismaModule, RealtimeModule],
  controllers: [BookingsHttpController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
