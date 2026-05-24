import { Controller, Get } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../common/decorators/roles.decorator";
import { AdminPlatformService } from "./admin-platform.service";

@Controller("admin")
@Roles(UserRole.admin)
export class AdminController {
  constructor(private readonly platform: AdminPlatformService) {}

  @Get("platform-modules")
  platformModules() {
    return this.platform.getModuleStatuses();
  }
}
