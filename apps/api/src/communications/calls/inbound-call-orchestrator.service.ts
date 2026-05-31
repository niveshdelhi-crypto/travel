import { Injectable, Logger } from "@nestjs/common";
import {
  CallDirection,
  CallEventType,
  CallProvider,
  CallStatus,
  Prisma,
  UserRole,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { normalizeToE164 } from "../../common/utils/phone.util";
import { TelnyxService } from "../telnyx/telnyx.service";
import type { TelnyxCallPayload, TelnyxWebhookDto } from "./dto/telnyx-webhook.dto";
import { CallCustomerLookupService } from "./call-customer-lookup.service";
import { CallStateManagerService } from "./call-state-manager.service";

const ASSIGNMENT_LOCK_KEY = "fleetnexus:inbound-call-routing";

@Injectable()
export class InboundCallOrchestratorService {
  private readonly logger = new Logger(InboundCallOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telnyx: TelnyxService,
    private readonly callState: CallStateManagerService,
    private readonly customerLookup: CallCustomerLookupService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async handleTelnyxWebhook(dto: TelnyxWebhookDto): Promise<{ ok: true }> {
    const eventType = dto.data?.event_type;
    const payload = dto.data?.payload;
    if (!eventType || !payload) {
      return { ok: true };
    }

    const providerCallId = payload.call_control_id ?? payload.call_session_id;
    if (!providerCallId) {
      this.logger.warn(JSON.stringify({ message: "telnyx.webhook.missing_call_id", eventType }));
      return { ok: true };
    }

    if (eventType === "call.initiated" && this.isInbound(payload)) {
      await this.onInboundInitiated(providerCallId, payload, dto);
      return { ok: true };
    }

    const call = await this.prisma.call.findFirst({
      where: { provider_call_id: providerCallId },
    });

    if (!call) {
      if (this.isInbound(payload) && eventType === "call.ringing") {
        await this.onInboundInitiated(providerCallId, payload, dto);
      }
      return { ok: true };
    }

    await this.prisma.callEvent.create({
      data: {
        call_id: call.id,
        event_type: CallEventType.WEBHOOK_RECEIVED,
        provider_event: eventType,
        payload: dto as Prisma.InputJsonValue,
        occurred_at: dto.data?.occurred_at ? new Date(dto.data.occurred_at) : new Date(),
      },
    });

    if (eventType === "call.recording.saved" || eventType === "call.recording.completed") {
      await this.persistRecording(call.id, call.traveler_id, payload);
      return { ok: true };
    }

    const mapped = this.callState.mapTelnyxEventToCallStatus(eventType);
    if (!mapped || mapped === call.status) {
      return { ok: true };
    }

    let durationSeconds: number | undefined;
    if (payload.start_time && payload.end_time) {
      const start = new Date(payload.start_time).getTime();
      const end = new Date(payload.end_time).getTime();
      if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
        durationSeconds = Math.round((end - start) / 1000);
      }
    }

    const updated = await this.callState.transition(call.id, mapped, {
      providerEvent: eventType,
      payload: dto as Prisma.InputJsonValue,
      failureReason: payload.hangup_cause ?? payload.sip_hangup_cause,
      durationSeconds,
      providerCallId,
    });

    if (mapped === CallStatus.COMPLETED || mapped === CallStatus.VOICEMAIL) {
      const context = await this.customerLookup.resolveByPhone(call.from_number);
      this.realtime.emitCallCompletedWithContext(this.toBaseRealtime(updated), context);
    }

    return { ok: true };
  }

  private async onInboundInitiated(
    providerCallId: string,
    payload: TelnyxCallPayload,
    dto: TelnyxWebhookDto,
  ) {
    const existing = await this.prisma.call.findFirst({
      where: { provider_call_id: providerCallId },
    });
    if (existing) return;

    const fromNumber = normalizeToE164(payload.from ?? "");
    const toNumber = normalizeToE164(payload.to ?? "");
    const callerContext = await this.customerLookup.resolveByPhone(fromNumber);
    const agent = await this.resolveAgentForInbound(toNumber);

    const call = await this.prisma.call.create({
      data: {
        provider: CallProvider.TELNYX,
        provider_call_id: providerCallId,
        direction: CallDirection.INBOUND,
        status: CallStatus.RINGING,
        from_number: fromNumber,
        to_number: toNumber,
        agent_id: agent.id,
        lead_id: callerContext.lead_id,
        traveler_id: callerContext.traveler_id,
        started_at: new Date(),
        metadata: {
          telnyx_event_id: dto.data?.id,
          connection_id: payload.connection_id,
        } as Prisma.InputJsonValue,
      },
    });

    await this.prisma.callEvent.create({
      data: {
        call_id: call.id,
        event_type: CallEventType.CREATED,
        provider_event: dto.data?.event_type,
        payload: dto as Prisma.InputJsonValue,
      },
    });

    await this.prisma.activeCallSession.create({
      data: {
        call_id: call.id,
        agent_id: agent.id,
        provider_call_id: providerCallId,
        status: CallStatus.RINGING,
        connected_at: new Date(),
        expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000),
      },
    });

    const realtimePayload = this.buildIncomingRealtimePayload(call, callerContext);
    this.realtime.emitIncomingCall(realtimePayload);
    this.realtime.emitCallRinging(this.toBaseRealtime(call));

    if (this.telnyx.isConfigured()) {
      try {
        await this.telnyx.answerCall(providerCallId);
        const connectionId = this.telnyx.getConnectionId();
        if (connectionId) {
          await this.telnyx.bridgeToConnection(providerCallId, connectionId);
        }
      } catch (error) {
        this.logger.warn(
          JSON.stringify({
            message: "telnyx.inbound.bridge_failed",
            callId: call.id,
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      }
    }

    this.logger.log(
      JSON.stringify({
        message: "inbound.call.created",
        callId: call.id,
        agentId: agent.id,
        providerCallId,
        fromNumber,
        isExistingCustomer: callerContext.is_existing_customer,
      }),
    );
  }

  private async resolveAgentForInbound(toNumber: string) {
    const normalizedTo = normalizeToE164(toNumber);
    const byLine = await this.prisma.user.findFirst({
      where: {
        direct_line: normalizedTo,
        is_active: true,
        role: { in: [UserRole.sales_agent, UserRole.admin] },
      },
      select: { id: true, name: true, email: true, role: true, current_lead_count: true },
    });
    if (byLine) return byLine;

    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ASSIGNMENT_LOCK_KEY}))`;
      const agent = await tx.user.findFirst({
        where: { role: UserRole.sales_agent, is_active: true },
        orderBy: [{ current_lead_count: "asc" }, { created_at: "asc" }],
        select: { id: true, name: true, email: true, role: true, current_lead_count: true },
      });
      if (!agent) {
        const fallback = await tx.user.findFirst({
          where: { role: UserRole.admin, is_active: true },
          orderBy: { created_at: "asc" },
          select: { id: true, name: true, email: true, role: true, current_lead_count: true },
        });
        if (!fallback) throw new Error("No active agents available for inbound routing");
        return fallback;
      }
      return agent;
    });
  }

  private async persistRecording(
    callId: string,
    travelerId: string | null,
    payload: TelnyxCallPayload,
  ) {
    const url =
      payload.recording_url ??
      payload.public_recording_urls?.mp3 ??
      payload.recording_urls?.mp3;

    if (!url) return;

    const recordingId = payload.recording_id;
    const data = {
      url,
      status: "available",
      format: "mp3",
      metadata: payload as Prisma.InputJsonValue,
      traveler_id: travelerId,
    };

    if (recordingId) {
      await this.prisma.callRecording.upsert({
        where: { provider_recording_id: recordingId },
        create: { call_id: callId, provider_recording_id: recordingId, ...data },
        update: data,
      });
    } else {
      await this.prisma.callRecording.create({
        data: { call_id: callId, ...data },
      });
    }

    await this.prisma.call.update({
      where: { id: callId },
      data: { recording_url: url },
    });

    await this.prisma.callEvent.create({
      data: {
        call_id: callId,
        event_type: CallEventType.RECORDING_STOPPED,
        provider_event: "call.recording.saved",
        payload: payload as Prisma.InputJsonValue,
      },
    });
  }

  private isInbound(payload: TelnyxCallPayload): boolean {
    const direction = payload.direction?.toLowerCase();
    return direction === "incoming" || direction === "inbound";
  }

  private buildIncomingRealtimePayload(
    call: {
      id: string;
      status: CallStatus;
      direction: CallDirection;
      agent_id: string | null;
      lead_id: string | null;
      provider_call_id: string | null;
      from_number: string;
      to_number: string;
      started_at: Date | null;
    },
    context: Awaited<ReturnType<CallCustomerLookupService["resolveByPhone"]>>,
  ) {
    return {
      ...this.toBaseRealtime(call),
      from_number: call.from_number,
      to_number: call.to_number,
      started_at: call.started_at?.toISOString() ?? null,
      caller: context,
    };
  }

  private toBaseRealtime(call: {
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
      provider: "TELNYX" as const,
    };
  }
}
