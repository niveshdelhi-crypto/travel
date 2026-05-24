import { Controller, Get } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import { AnalyticsService } from "./analytics.service";

@Controller("analytics")
@Roles(UserRole.admin)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("overview")
  overview(@CurrentUser() user: AuthenticatedUser) {
    return this.analyticsService.overview(user);
  }
}
