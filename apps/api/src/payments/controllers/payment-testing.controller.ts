import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { UserRole } from "@prisma/client";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import {
  PaymentTestingAttemptActionDto,
  PaymentTestingEnvironmentQueryDto,
  PaymentTestingRefundDto,
} from "../dto/payment-testing.dto";
import {
  PaymentTestingService,
  type PayPalEnvironment,
} from "../services/payment-testing.service";

function requestContext(req: Request) {
  return {
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    requestMethod: req.method,
    requestPath: req.originalUrl,
  };
}

@Controller("payments/testing")
@Roles(UserRole.admin)
export class PaymentTestingController {
  constructor(private readonly testing: PaymentTestingService) {}

  @Get("console")
  getConsole(@Query() query: PaymentTestingEnvironmentQueryDto) {
    const environment: PayPalEnvironment = query.environment ?? "sandbox";
    return this.testing.getConsole(environment);
  }

  @Get("captures")
  listCaptures(
    @Query() query: PaymentTestingEnvironmentQueryDto,
    @Query("limit", new ParseIntPipe({ optional: true })) limit = 50,
  ) {
    return this.testing.listCaptures(query.environment ?? "sandbox", limit);
  }

  @Get("failures")
  listFailures(
    @Query() query: PaymentTestingEnvironmentQueryDto,
    @Query("limit", new ParseIntPipe({ optional: true })) limit = 50,
  ) {
    return this.testing.listFailures(query.environment ?? "sandbox", limit);
  }

  @Get("refunds")
  listRefunds(
    @Query() query: PaymentTestingEnvironmentQueryDto,
    @Query("limit", new ParseIntPipe({ optional: true })) limit = 50,
  ) {
    return this.testing.listRefunds(query.environment ?? "sandbox", limit);
  }

  @Get("audit/:resourceType/:resourceId")
  getAudit(
    @Param("resourceType") resourceType: string,
    @Param("resourceId") resourceId: string,
  ) {
    return this.testing.getAuditTrail(resourceType, resourceId);
  }

  @Post("retry-capture")
  retryCapture(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PaymentTestingAttemptActionDto,
    @Req() req: Request,
  ) {
    return this.testing.retryCapture(user, dto, requestContext(req));
  }

  @Post("void-order")
  voidOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PaymentTestingAttemptActionDto,
    @Req() req: Request,
  ) {
    return this.testing.voidOrder(user, dto, requestContext(req));
  }

  @Post("refund")
  refund(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PaymentTestingRefundDto,
    @Req() req: Request,
  ) {
    return this.testing.refundCapture(user, dto, requestContext(req));
  }
}
