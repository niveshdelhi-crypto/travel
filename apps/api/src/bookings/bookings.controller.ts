import { Body, Controller, Get, ParseIntPipe, Post, Query } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import { BookingsService } from "./bookings.service";
import { CloseLeadBookingDto } from "./dto/close-lead-booking.dto";

@Controller("bookings")
export class BookingsHttpController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post("close-lead")
  closeLead(@CurrentUser() user: AuthenticatedUser, @Body() dto: CloseLeadBookingDto) {
    return this.bookingsService.closeLeadAsBooked(user, dto);
  }

  @Roles(UserRole.admin)
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("pageSize", new ParseIntPipe({ optional: true })) pageSize = 25,
  ) {
    return this.bookingsService.listBookings(user, page, pageSize);
  }
}
