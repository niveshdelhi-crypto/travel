import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminPlatformService } from "./admin-platform.service";

@Module({
  controllers: [AdminController],
  providers: [AdminPlatformService],
  exports: [AdminPlatformService],
})
export class AdminModule {}
