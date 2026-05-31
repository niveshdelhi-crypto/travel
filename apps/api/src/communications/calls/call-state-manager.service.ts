import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { Call, CallEventType, CallStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { RealtimeGateway } from "../../realtime/realtime.gateway";

const TERMINAL_STATUSES: ReadonlySet<CallStatus> = new Set([
  CallStatus.COMPLETED,
  CallStatus.FAILED,
  CallStatus.BUSY,
  CallStatus.NO_ANSWER,
  CallStatus.VOICEMAIL,
  CallStatus.CANCELLED,
]);

const ALLOWED_TRANSITIONS: Record<CallStatus, ReadonlySet<CallStatus>> = {
  [CallStatus.INITIATED]: new Set([
    CallStatus.RINGING,
    CallStatus.ANSWERED,
    CallStatus.FAILED,
    CallStatus.CANCELLED,
  ]),
  [CallStatus.RINGING]: new Set([
    CallStatus.ANSWERED,
    CallStatus.COMPLETED,
    CallStatus.FAILED,
    CallStatus.BUSY,
    CallStatus.NO_ANSWER,
    CallStatus.VOICEMAIL,
    CallStatus.CANCELLED,
  ]),
  [CallStatus.ANSWERED]: new Set([
    CallStatus.COMPLETED,
    CallStatus.FAILED,
    CallStatus.CANCELLED,
  ]),
  [CallStatus.COMPLETED]: new Set(),
  [CallStatus.FAILED]: new Set(),
  [CallStatus.BUSY]: new Set(),
  [CallStatus.NO_ANSWER]: new Set(),
  [CallStatus.VOICEMAIL]: new Set(),
  [CallStatus.CANCELLED]: new Set(),
};

const STATUS_TO_EVENT_TYPE: Partial<Record<CallStatus, CallEventType>> = {
  [CallStatus.RINGING]: CallEventType.RINGING,
  [CallStatus.ANSWERED]: CallEventType.ANSWERED,
  [CallStatus.COMPLETED]: CallEventType.COMPLETED,
  [CallStatus.FAILED]: CallEventType.FAILED,
  [CallStatus.BUSY]: CallEventType.BUSY,
  [CallStatus.NO_ANSWER]: CallEventType.NO_ANSWER,
};

@Injectable()
export class CallStateManagerService {
  private readonly logger = new Logger(CallStateManagerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  canTransition(from: CallStatus, to: CallStatus): boolean {
    if (from === to) return true;
    if (TERMINAL_STATUSES.has(from)) return false;
    return ALLOWED_TRANSITIONS[from].has(to);
  }

  async transition(
    callId: string,
    nextStatus: CallStatus,
    options?: {
      providerEvent?: string;
      payload?: Prisma.InputJsonValue;
      failureReason?: string;
      durationSeconds?: number;
      providerCallId?: string;
    },
  ): Promise<Call> {
    const existing = await this.prisma.call.findUnique({ where: { id: callId } });
    if (!existing) {
      throw new BadRequestException(`Call ${callId} not found`);
    }

    if (!this.canTransition(existing.status, nextStatus)) {
      throw new BadRequestException(
        `Invalid call status transition: ${existing.status} -> ${nextStatus}`,
      );
    }

    const now = new Date();
    const updated = await this.prisma.call.update({
      where: { id: callId },
      data: {
        status: nextStatus,
        ...(options?.providerCallId ? { provider_call_id: options.providerCallId } : {}),
        ...(options?.failureReason ? { failure_reason: options.failureReason } : {}),
        ...(options?.durationSeconds !== undefined
          ? { duration_seconds: options.durationSeconds }
          : {}),
        ...(nextStatus === CallStatus.RINGING && !existing.started_at ? { started_at: now } : {}),
        ...(nextStatus === CallStatus.ANSWERED && !existing.answered_at
          ? { answered_at: now }
          : {}),
        ...(TERMINAL_STATUSES.has(nextStatus) && !existing.ended_at ? { ended_at: now } : {}),
      },
    });

    const eventType =
      STATUS_TO_EVENT_TYPE[nextStatus] ??
      (existing.status !== nextStatus ? CallEventType.STATE_CHANGED : null);

    if (eventType && existing.status !== nextStatus) {
      await this.prisma.callEvent.create({
        data: {
          call_id: callId,
          event_type: eventType,
          provider_event: options?.providerEvent,
          payload: options?.payload,
          occurred_at: now,
        },
      });
    }

    if (TERMINAL_STATUSES.has(nextStatus)) {
      await this.prisma.activeCallSession.deleteMany({ where: { call_id: callId } });
    } else {
      await this.syncActiveSession(updated);
    }

    if (existing.status !== nextStatus) {
      this.emitRealtimeForStatus(updated);
      this.logInfo("call.status.transitioned", {
        callId,
        from: existing.status,
        to: nextStatus,
        providerCallId: updated.provider_call_id,
      });
    }

    return updated;
  }

  mapVonageStatusToCallStatus(vonageStatus: string | undefined): CallStatus | null {
    const normalized = vonageStatus?.trim().toLowerCase();
    switch (normalized) {
      case "started":
      case "ringing":
        return CallStatus.RINGING;
      case "answered":
        return CallStatus.ANSWERED;
      case "completed":
        return CallStatus.COMPLETED;
      case "failed":
      case "rejected":
      case "timeout":
        return CallStatus.FAILED;
      case "busy":
        return CallStatus.BUSY;
      case "unanswered":
      case "machine":
        return CallStatus.NO_ANSWER;
      case "cancelled":
        return CallStatus.CANCELLED;
      default:
        return null;
    }
  }

  mapTelnyxEventToCallStatus(eventType: string | undefined): CallStatus | null {
    const normalized = eventType?.trim().toLowerCase();
    switch (normalized) {
      case "call.initiated":
        return CallStatus.INITIATED;
      case "call.ringing":
        return CallStatus.RINGING;
      case "call.answered":
        return CallStatus.ANSWERED;
      case "call.hangup":
      case "call.ended":
        return CallStatus.COMPLETED;
      case "call.busy":
        return CallStatus.BUSY;
      case "call.no_answer":
      case "call.unanswered":
        return CallStatus.NO_ANSWER;
      case "call.machine_detection_ended":
      case "call.voicemail":
        return CallStatus.VOICEMAIL;
      case "call.failed":
        return CallStatus.FAILED;
      default:
        return null;
    }
  }

  private async syncActiveSession(call: Call) {
    if (!call.agent_id || TERMINAL_STATUSES.has(call.status)) {
      return;
    }

    await this.prisma.activeCallSession.upsert({
      where: { call_id: call.id },
      create: {
        call_id: call.id,
        agent_id: call.agent_id,
        provider_call_id: call.provider_call_id,
        status: call.status,
        connected_at: call.answered_at ?? call.started_at,
        expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000),
      },
      update: {
        provider_call_id: call.provider_call_id,
        status: call.status,
        connected_at: call.answered_at ?? call.started_at,
      },
    });
  }

  private emitRealtimeForStatus(call: Call) {
    const payload = {
      id: call.id,
      status: call.status,
      direction: call.direction,
      agent_id: call.agent_id,
      lead_id: call.lead_id,
      provider_call_id: call.provider_call_id,
    };

    switch (call.status) {
      case CallStatus.RINGING:
        this.realtime.emitCallRinging(payload);
        break;
      case CallStatus.ANSWERED:
        this.realtime.emitCallAnswered(payload);
        break;
      case CallStatus.COMPLETED:
        this.realtime.emitCallCompleted(payload);
        break;
      case CallStatus.FAILED:
      case CallStatus.BUSY:
      case CallStatus.NO_ANSWER:
      case CallStatus.VOICEMAIL:
        this.realtime.emitCallFailed({
          ...payload,
          failure_reason: call.failure_reason,
        });
        break;
      default:
        break;
    }
  }

  private logInfo(message: string, data: Record<string, unknown>) {
    this.logger.log(JSON.stringify({ message, ...data }));
  }
}
