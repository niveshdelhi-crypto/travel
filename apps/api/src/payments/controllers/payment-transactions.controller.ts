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
import { RefundPaymentDto } from "../dto/refund-payment.dto";
import { ListTransactionsQueryDto } from "../dto/list-payments-query.dto";
import { PaymentTransactionService } from "../services/payment-transaction.service";

@Controller("payments/transactions")
@Roles(...PAYMENT_READ_ROLES)
export class PaymentTransactionsController {
  constructor(private readonly transactionService: PaymentTransactionService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("pageSize", new ParseIntPipe({ optional: true })) pageSize = 25,
    @Query() query: ListTransactionsQueryDto = {},
  ) {
    return this.transactionService.listTransactions(user, page, pageSize, query.status);
  }

  @Get(":id")
  get(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.transactionService.getTransaction(user, id);
  }

  @Post(":id/process")
  @Roles(...PAYMENT_PROCESS_ROLES)
  process(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.transactionService.processTransaction(user, id);
  }

  @Post(":id/capture")
  @Roles(...PAYMENT_PROCESS_ROLES)
  capture(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.transactionService.captureTransaction(user, id);
  }

  @Post(":id/refund")
  @Roles(...PAYMENT_PROCESS_ROLES)
  refund(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.transactionService.refundTransaction(user, id, dto.reason);
  }
}
