import {
  Patch,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import {
  PAYMENT_PROCESS_ROLES,
  PAYMENT_READ_ROLES,
} from "../constants/payment-roles.constants";
import { CompletePaymentSessionDto } from "./dto/complete-payment-session.dto";
import { CreatePaymentSessionDto } from "./dto/create-payment-session.dto";
import { FailPaymentSessionDto } from "./dto/fail-payment-session.dto";
import { CaptureCheckoutOrderDto } from "./dto/capture-checkout-order.dto";
import { RecordCheckoutFailureDto } from "./dto/record-checkout-failure.dto";
import { QuickCollectPaymentDto } from "./dto/quick-collect-payment.dto";
import { UpdateFinanceNotesDto } from "./dto/update-finance-notes.dto";
import { PaymentSessionCheckoutService } from "./payment-session-checkout.service";
import { PaymentSessionsService } from "./payment-sessions.service";

function requestContext(req: Request) {
  return {
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    requestMethod: req.method,
    requestPath: req.originalUrl,
  };
}

@Controller("payment-sessions")
@Roles(...PAYMENT_READ_ROLES)
export class PaymentSessionsController {
  constructor(
    private readonly sessionsService: PaymentSessionsService,
    private readonly checkoutService: PaymentSessionCheckoutService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePaymentSessionDto,
    @Req() req: Request,
  ) {
    return this.sessionsService.create(user, dto, requestContext(req));
  }

  @Get("gateway-health")
  @Roles(...PAYMENT_PROCESS_ROLES)
  getGatewayHealth(@CurrentUser() user: AuthenticatedUser) {
    return this.checkoutService.getGatewayHealth(user);
  }

  @Post("quick-collect")
  @Roles(...PAYMENT_PROCESS_ROLES)
  quickCollect(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: QuickCollectPaymentDto,
    @Req() req: Request,
  ) {
    return this.sessionsService.quickCollect(user, dto, requestContext(req));
  }

  @Get("queue")
  @Roles(...PAYMENT_PROCESS_ROLES)
  getQueue(@CurrentUser() user: AuthenticatedUser) {
    return this.sessionsService.getQueue(user);
  }

  @Get("metrics")
  @Roles(...PAYMENT_PROCESS_ROLES)
  getMetrics(@CurrentUser() user: AuthenticatedUser) {
    return this.sessionsService.getMetrics(user);
  }

  @Get(":id/attempts")
  @Roles(...PAYMENT_PROCESS_ROLES)
  getAttempts(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.checkoutService.listAttempts(user, id);
  }

  @Get(":id/checkout-config")
  @Roles(...PAYMENT_PROCESS_ROLES)
  getCheckoutConfig(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.checkoutService.getCheckoutConfig(user, id);
  }

  @Get(":id/audit")
  @Roles(...PAYMENT_PROCESS_ROLES)
  getAudit(@Param("id", ParseUUIDPipe) id: string) {
    return this.sessionsService.listSessionAudit(id);
  }

  @Get(":id")
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    return this.sessionsService.getById(user, id, requestContext(req));
  }

  @Post(":id/checkout/create-order")
  @Roles(...PAYMENT_PROCESS_ROLES)
  createCheckoutOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    return this.checkoutService.createProviderOrder(user, id, requestContext(req));
  }

  @Post(":id/checkout/capture")
  @Roles(...PAYMENT_PROCESS_ROLES)
  captureCheckoutOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CaptureCheckoutOrderDto,
    @Req() req: Request,
  ) {
    return this.checkoutService.captureProviderOrder(user, id, dto, requestContext(req));
  }

  @Post(":id/checkout/record-failure")
  @Roles(...PAYMENT_PROCESS_ROLES)
  recordCheckoutFailure(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RecordCheckoutFailureDto,
    @Req() req: Request,
  ) {
    return this.checkoutService.recordCheckoutFailure(user, id, dto, requestContext(req));
  }

  @Post(":id/checkout/submitted")
  @Roles(...PAYMENT_PROCESS_ROLES)
  markCheckoutSubmitted(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CaptureCheckoutOrderDto,
  ) {
    return this.checkoutService.markAttemptSubmitted(user, id, dto.order_id);
  }

  @Patch(":id/finance-notes")
  @Roles(...PAYMENT_PROCESS_ROLES)
  updateFinanceNotes(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateFinanceNotesDto,
    @Req() req: Request,
  ) {
    return this.checkoutService.updateFinanceNotes(user, id, dto, requestContext(req));
  }

  @Post(":id/start")
  @Roles(...PAYMENT_PROCESS_ROLES)
  start(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    return this.sessionsService.start(user, id, requestContext(req));
  }

  @Post(":id/complete")
  @Roles(...PAYMENT_PROCESS_ROLES)
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CompletePaymentSessionDto,
    @Req() req: Request,
  ) {
    return this.sessionsService.complete(user, id, dto, requestContext(req));
  }

  @Post(":id/fail")
  @Roles(...PAYMENT_PROCESS_ROLES)
  fail(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: FailPaymentSessionDto,
    @Req() req: Request,
  ) {
    return this.sessionsService.fail(user, id, dto, requestContext(req));
  }

  @Post(":id/cancel")
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    return this.sessionsService.cancel(user, id, requestContext(req));
  }
}
