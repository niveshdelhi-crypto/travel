import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { LeadsController } from "./leads.controller";
import { LeadsService } from "./leads.service";

@Module({
  imports: [PrismaModule, RealtimeModule],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
