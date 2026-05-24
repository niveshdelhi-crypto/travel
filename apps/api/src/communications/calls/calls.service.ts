import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  CallDirection,
  CallEventType,
  CallProvider,
  CallStatus,
  Prisma,
  UserRole,
} from "@prisma/client";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user";
import { PrismaService } from "../../prisma/prisma.service";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { VonageConfigurationError } from "../vonage/vonage.errors";
import { VonageService } from "../vonage/vonage.service";
import { isValidVonageCallUuid } from "../vonage/utils/vonage-call-uuid";
import { CallStateManagerService } from "./call-state-manager.service";
import { CreateOutboundCallDto } from "./dto/create-outbound-call.dto";
import { RegisterInboundCallDto } from "./dto/register-inbound-call.dto";
import { VonageAnswerWebhookDto } from "./dto/vonage-answer-webhook.dto";
import { VonageRecordingWebhookDto } from "./dto/vonage-recording-webhook.dto";
import { VonageWebhookEventDto } from "./dto/vonage-webhook-event.dto";
import { isPlausibleE164, normalizeToE164 } from "../../common/utils/phone.util";

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vonage: VonageService,
    private readonly callState: CallStateManagerService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async createOutbound(user: AuthenticatedUser, dto: CreateOutboundCallDto) {
    if (!this.vonage.isConfigured()) {
      throw new ServiceUnavailableException("Vonage telephony is not configured");
    }

    if (dto.lead_id) {
      await this.assertLeadAccess(dto.lead_id, user);
    }

    const toNumber = normalizeToE164(dto.to_number);
    if (!isPlausibleE164(toNumber)) {
      throw new BadRequestException(
        "to_number must be a valid international number (E.164), e.g. +14155550100",
      );
    }

    const fromNumber = normalizeToE164(
      dto.from_number ?? this.vonage.getDefaultFromNumber(),
    );
    if (!isPlausibleE164(fromNumber)) {
      throw new BadRequestException("from_number is not a valid E.164 number");
    }

    const call = await this.prisma.call.create({
      data: {
        provider: CallProvider.VONAGE,
        direction: CallDirection.OUTBOUND,
        status: CallStatus.INITIATED,
        from_number: fromNumber,
        to_number: toNumber,
        agent_id: user.id,
        lead_id: dto.lead_id,
        metadata: { initiated_by: user.id },
      },
    });

    await this.prisma.callEvent.create({
      data: {
        call_id: call.id,
        event_type: CallEventType.CREATED,
        payload: { direction: CallDirection.OUTBOUND },
      },
    });

    this.realtime.emitCallCreated(this.toRealtimePayload(call));

    try {
      const providerResult = await this.vonage.createOutboundCall({
        to: [{ type: "phone", number: toNumber }],
        from: { type: "phone", number: fromNumber },
      });

      const updated = await this.callState.transition(call.id, CallStatus.RINGING, {
        providerCallId: providerResult.uuid,
        providerEvent: providerResult.status,
        payload: { vonage: providerResult },
      });

      return updated;
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Outbound call failed";
      await this.callState.transition(call.id, CallStatus.FAILED, {
        failureReason: reason,
        payload: { error: reason },
      });
      if (error instanceof VonageConfigurationError) {
        throw new ServiceUnavailableException(reason);
      }
      throw error;
    }
  }

  async listForUser(user: AuthenticatedUser, page = 1, pageSize = 25) {
    const pageSz = Math.min(100, Math.max(10, pageSize));
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * pageSz;
    const where: Prisma.CallWhereInput =
      user.role === UserRole.admin ? {} : { agent_id: user.id };

    const [data, total] = await Promise.all([
      this.prisma.call.findMany({
        where,
        include: {
          lead: {
            select: {
              id: true,
              customer_name: true,
              customer_phone: true,
              pickup_location: true,
              drop_location: true,
            },
          },
          agent: { select: { id: true, name: true, email: true } },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: pageSz,
      }),
      this.prisma.call.count({ where }),
    ]);

    return {
      data,
      page: safePage,
      pageSize: pageSz,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSz)),
    };
  }

  async registerInbound(user: AuthenticatedUser, dto: RegisterInboundCallDto) {
    if (dto.lead_id) {
      await this.assertLeadAccess(dto.lead_id, user);
    }

    const call = await this.prisma.call.create({
      data: {
        provider: CallProvider.VONAGE,
        provider_call_id: dto.provider_call_id,
        direction: CallDirection.INBOUND,
        status: CallStatus.RINGING,
        from_number: dto.from_number,
        to_number: dto.to_number,
        agent_id: user.id,
        lead_id: dto.lead_id,
        started_at: new Date(),
        metadata: { registered_by: user.id },
      },
    });

    await this.prisma.callEvent.create({
      data: {
        call_id: call.id,
        event_type: CallEventType.CREATED,
        payload: { direction: CallDirection.INBOUND },
      },
    });

    await this.prisma.activeCallSession.create({
      data: {
        call_id: call.id,
        agent_id: user.id,
        provider_call_id: dto.provider_call_id,
        status: CallStatus.RINGING,
        connected_at: new Date(),
        expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000),
      },
    });

    this.realtime.emitCallCreated(this.toRealtimePayload(call));
    this.realtime.emitCallRinging(this.toRealtimePayload(call));

    this.logInfo("call.inbound.registered", {
      callId: call.id,
      agentId: user.id,
      providerCallId: dto.provider_call_id,
    });

    return call;
  }

  async handleVonageEvent(dto: VonageWebhookEventDto) {
    const providerCallId = dto.uuid;
    if (providerCallId && !isValidVonageCallUuid(providerCallId)) {
      this.logWarn("call.webhook.event.invalid_uuid", { uuid: providerCallId });
      return { ok: true };
    }
    if (!providerCallId) {
      this.logWarn("call.webhook.event.missing_uuid", { payload: dto });
      return { ok: true };
    }

    const call = await this.findCallByProviderId(providerCallId);
    if (!call) {
      this.logWarn("call.webhook.event.unknown_call", { providerCallId, status: dto.status });
      return { ok: true };
    }

    await this.prisma.callEvent.create({
      data: {
        call_id: call.id,
        event_type: CallEventType.WEBHOOK_RECEIVED,
        provider_event: dto.status,
        payload: dto as Prisma.InputJsonValue,
        occurred_at: dto.timestamp ? new Date(dto.timestamp) : new Date(),
      },
    });

    const mapped = this.callState.mapVonageStatusToCallStatus(dto.status);
    if (!mapped || mapped === call.status) {
      return { ok: true };
    }

    const durationSeconds = dto.duration ? Number.parseInt(dto.duration, 10) : undefined;

    await this.callState.transition(call.id, mapped, {
      providerEvent: dto.status,
      payload: dto as Prisma.InputJsonValue,
      failureReason: dto.reason,
      durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : undefined,
      providerCallId,
    });

    return { ok: true };
  }

  handleVonageAnswer(dto: VonageAnswerWebhookDto) {
    const providerCallId = dto.uuid ?? dto.call_id;
    this.logInfo("call.webhook.answer.received", {
      providerCallId,
      direction: dto.direction,
    });

    return [
      {
        action: "talk",
        text: "Please hold while we connect you to an agent.",
        language: "en-US",
        style: 0,
      },
    ];
  }

  async handleVonageRecording(dto: VonageRecordingWebhookDto) {
    const providerCallId = dto.call_uuid ?? dto.uuid;
    const recordingId = dto.recording_uuid;

    if (!providerCallId && !recordingId) {
      this.logWarn("call.webhook.recording.missing_identifiers", { payload: dto });
      return { ok: true };
    }

    const call = providerCallId
      ? await this.findCallByProviderId(providerCallId)
      : null;

    if (!call) {
      this.logWarn("call.webhook.recording.unknown_call", {
        providerCallId,
        recordingId,
      });
      return { ok: true };
    }

    const durationSeconds = dto.duration ? Number.parseInt(dto.duration, 10) : undefined;
    const recordingData = {
      url: dto.recording_url,
      duration_seconds: Number.isFinite(durationSeconds) ? durationSeconds : undefined,
      format: dto.format,
      status: dto.recording_url ? "available" : "processing",
      metadata: dto as Prisma.InputJsonValue,
    };

    if (recordingId) {
      await this.prisma.callRecording.upsert({
        where: { provider_recording_id: recordingId },
        create: {
          call_id: call.id,
          provider_recording_id: recordingId,
          ...recordingData,
        },
        update: recordingData,
      });
    } else {
      await this.prisma.callRecording.create({
        data: {
          call_id: call.id,
          ...recordingData,
        },
      });
    }

    await this.prisma.callEvent.create({
      data: {
        call_id: call.id,
        event_type: CallEventType.RECORDING_STOPPED,
        provider_event: "recording",
        payload: dto as Prisma.InputJsonValue,
      },
    });

    this.logInfo("call.recording.stored", {
      callId: call.id,
      recordingId,
      hasUrl: Boolean(dto.recording_url),
    });

    return { ok: true };
  }

  private async findCallByProviderId(providerCallId: string) {
    return this.prisma.call.findFirst({
      where: { provider_call_id: providerCallId },
    });
  }

  private async assertLeadAccess(leadId: string, user: AuthenticatedUser) {
    const lead = await this.prisma.lead.findFirst({
      where:
        user.role === UserRole.admin
          ? { id: leadId }
          : { id: leadId, assigned_to: user.id },
      select: { id: true },
    });

    if (!lead) {
      throw new NotFoundException("Lead not found");
    }
  }

  private toRealtimePayload(call: {
    id: string;
    status: CallStatus;
    direction: CallDirection;
    agent_id: string | null;
    lead_id: string | null;
    provider_call_id: string | null;
  }) {
    return {
      id: call.id,
      status: call.status,
      direction: call.direction,
      agent_id: call.agent_id,
      lead_id: call.lead_id,
      provider_call_id: call.provider_call_id,
    };
  }

  private logInfo(message: string, data: Record<string, unknown>) {
    this.logger.log(JSON.stringify({ message, ...data }));
  }

  private logWarn(message: string, data: Record<string, unknown>) {
    this.logger.warn(JSON.stringify({ message, ...data }));
  }
}
