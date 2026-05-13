import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { BookingsHttpController } from "./bookings.controller";
import { BookingsService } from "./bookings.service";
import { PaymentsHttpController } from "./payments.controller";

@Module({
  imports: [PrismaModule, RealtimeModule],
  controllers: [BookingsHttpController, PaymentsHttpController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
