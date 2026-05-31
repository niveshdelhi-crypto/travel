import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
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
import { TelnyxWebhookAuditInterceptor } from "../telnyx/interceptors/telnyx-webhook-audit.interceptor";
import { TelnyxWebhookGuard } from "../telnyx/telnyx-webhook.guard";
import { VonageWebhookGuard } from "../vonage/vonage-webhook.guard";
import { CallCenterMetricsService } from "./call-center-metrics.service";
import { CallDispositionService } from "./call-disposition.service";
import { CallsService } from "./calls.service";
import { CreateOutboundCallDto } from "./dto/create-outbound-call.dto";
import { QuickCreateLeadFromCallDto } from "./dto/quick-create-lead-from-call.dto";
import { RegisterInboundCallDto } from "./dto/register-inbound-call.dto";
import { SetCallDispositionDto } from "./dto/set-call-disposition.dto";
import { TelnyxWebhookDto } from "./dto/telnyx-webhook.dto";
import { VonageAnswerWebhookDto } from "./dto/vonage-answer-webhook.dto";
import { VonageRecordingWebhookDto } from "./dto/vonage-recording-webhook.dto";
import { VonageWebhookEventDto } from "./dto/vonage-webhook-event.dto";

@Controller("calls")
@Roles(UserRole.admin, UserRole.sales_agent)
export class CallsController {
  constructor(
    private readonly callsService: CallsService,
    private readonly metricsService: CallCenterMetricsService,
    private readonly dispositionService: CallDispositionService,
  ) {}

  @Get("center/metrics")
  centerMetrics(@CurrentUser() user: AuthenticatedUser) {
    return this.metricsService.getDashboardMetrics(user);
  }

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

  @Get(":id/context")
  getContext(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.callsService.getCallContext(id, user);
  }

  @Post(":id/leads/quick-create")
  quickCreateLead(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: QuickCreateLeadFromCallDto,
  ) {
    return this.callsService.quickCreateLeadFromCall(id, user, dto);
  }

  @Post(":id/disposition")
  setDisposition(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: SetCallDispositionDto,
  ) {
    return this.dispositionService.setDisposition(id, user, dto);
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

@Controller("calls/webhooks/telnyx")
@Public()
@SkipCsrf()
@UseGuards(TelnyxWebhookGuard)
@UseInterceptors(TelnyxWebhookAuditInterceptor)
@Throttle({ telnyxWebhooks: { limit: 120, ttl: 60_000 } })
export class TelnyxWebhooksController {
  constructor(private readonly callsService: CallsService) {}

  @Post()
  telnyxEvents(@Body() dto: TelnyxWebhookDto) {
    return this.callsService.handleTelnyxWebhook(dto);
  }
}
