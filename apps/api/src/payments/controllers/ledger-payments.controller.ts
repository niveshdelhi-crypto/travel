import { Controller, Get, ParseIntPipe, Query } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user";
import { BookingsService } from "../../bookings/bookings.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { PAYMENT_READ_ROLES } from "../constants/payment-roles.constants";

@Controller("payments")
@Roles(UserRole.admin, UserRole.finance_admin)
export class LedgerPaymentsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /** Backward-compatible ledger list (pre-orchestration route). */
  @Get()
  @Roles(...PAYMENT_READ_ROLES)
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("pageSize", new ParseIntPipe({ optional: true })) pageSize = 25,
  ) {
    return this.bookingsService.listPayments(user, page, pageSize);
  }

  @Get("ledger")
  @Roles(...PAYMENT_READ_ROLES)
  listLedger(
    @CurrentUser() user: AuthenticatedUser,
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("pageSize", new ParseIntPipe({ optional: true })) pageSize = 25,
  ) {
    return this.bookingsService.listPayments(user, page, pageSize);
  }
}
