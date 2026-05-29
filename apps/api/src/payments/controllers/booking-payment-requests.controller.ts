import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import {
  PAYMENT_PROCESS_ROLES,
  PAYMENT_READ_ROLES,
} from "../constants/payment-roles.constants";
import { CreateBookingPaymentRequestDto } from "../dto/create-booking-payment-request.dto";
import { BookingPaymentWorkflowService } from "../services/booking-payment-workflow.service";

@Controller("payments/booking-requests")
@Roles(...PAYMENT_READ_ROLES)
export class BookingPaymentRequestsController {
  constructor(private readonly workflowService: BookingPaymentWorkflowService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("pageSize", new ParseIntPipe({ optional: true })) pageSize = 25,
  ) {
    return this.workflowService.listPaymentRequests(user, page, pageSize);
  }

  @Get(":id")
  get(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.workflowService.getPaymentRequest(user, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBookingPaymentRequestDto) {
    return this.workflowService.createPaymentRequest(user, dto);
  }

  @Post(":id/process")
  @Roles(...PAYMENT_PROCESS_ROLES)
  process(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.workflowService.processPaymentRequest(user, id);
  }
}
