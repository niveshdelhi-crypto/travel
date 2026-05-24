import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { SkipCsrf } from "../../common/decorators/skip-csrf.decorator";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user";
import { VonageWebhookValidationFilter } from "../vonage/filters/vonage-webhook-validation.filter";
import { VonageWebhookAuditInterceptor } from "../vonage/interceptors/vonage-webhook-audit.interceptor";
import { VonageWebhookGuard } from "../vonage/vonage-webhook.guard";
import { CallsService } from "./calls.service";
import { CreateOutboundCallDto } from "./dto/create-outbound-call.dto";
import { RegisterInboundCallDto } from "./dto/register-inbound-call.dto";
import { VonageAnswerWebhookDto } from "./dto/vonage-answer-webhook.dto";
import { VonageRecordingWebhookDto } from "./dto/vonage-recording-webhook.dto";
import { VonageWebhookEventDto } from "./dto/vonage-webhook-event.dto";

@Controller("calls")
@Roles(UserRole.admin, UserRole.sales_agent)
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("pageSize", new ParseIntPipe({ optional: true })) pageSize = 25,
  ) {
    return this.callsService.listForUser(user, page, pageSize);
  }

  @Post("outbound")
  createOutbound(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOutboundCallDto,
  ) {
    return this.callsService.createOutbound(user, dto);
  }

  @Post("inbound")
  registerInbound(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterInboundCallDto,
  ) {
    return this.callsService.registerInbound(user, dto);
  }
}

@Controller("calls/webhooks")
@Public()
@SkipCsrf()
@UseGuards(VonageWebhookGuard)
@UseInterceptors(VonageWebhookAuditInterceptor)
@UseFilters(VonageWebhookValidationFilter)
@Throttle({ vonageWebhooks: { limit: 60, ttl: 60_000 } })
export class CallsWebhooksController {
  constructor(private readonly callsService: CallsService) {}

  @Post("events")
  vonageEvents(@Body() dto: VonageWebhookEventDto) {
    return this.callsService.handleVonageEvent(dto);
  }

  @Post("answer")
  vonageAnswer(@Body() dto: VonageAnswerWebhookDto) {
    return this.callsService.handleVonageAnswer(dto);
  }

  @Post("recording")
  vonageRecording(@Body() dto: VonageRecordingWebhookDto) {
    return this.callsService.handleVonageRecording(dto);
  }
}
