import { Controller, Get, ParseIntPipe, Query } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { BookingsService } from "./bookings.service";

@Controller("payments")
@Roles(UserRole.admin)
export class PaymentsHttpController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("pageSize", new ParseIntPipe({ optional: true })) pageSize = 25,
  ) {
    return this.bookingsService.listPayments(user, page, pageSize);
  }
}
