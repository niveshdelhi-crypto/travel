import { Controller, Get } from "@nestjs/common";
import { Public } from "../common/decorators/public.decorator";
import { AdminPlatformService } from "../admin/admin-platform.service";

@Controller("health")
export class HealthController {
  constructor(private readonly platform: AdminPlatformService) {}

  @Public()
  @Get()
  async check() {
    const modules = await this.platform.getModuleStatuses();
    const degraded = modules.some((m) => m.tone !== "success");
    return {
      ok: !degraded,
      modules,
      checkedAt: new Date().toISOString(),
    };
  }
}
