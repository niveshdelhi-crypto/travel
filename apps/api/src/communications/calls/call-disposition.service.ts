import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  CallDispositionType,
  CallEventType,
  CallStatus,
  Prisma,
  UserRole,
} from "@prisma/client";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user";
import { PrismaService } from "../../prisma/prisma.service";
import { CallStateManagerService } from "./call-state-manager.service";
import type { SetCallDispositionDto } from "./dto/set-call-disposition.dto";

const DISPOSITION_TO_STATUS: Record<CallDispositionType, CallStatus> = {
  [CallDispositionType.ANSWERED]: CallStatus.COMPLETED,
  [CallDispositionType.BUSY]: CallStatus.BUSY,
  [CallDispositionType.NO_ANSWER]: CallStatus.NO_ANSWER,
  [CallDispositionType.VOICEMAIL]: CallStatus.VOICEMAIL,
  [CallDispositionType.CALLBACK_REQUESTED]: CallStatus.COMPLETED,
};

@Injectable()
export class CallDispositionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly callState: CallStateManagerService,
  ) {}

  async setDisposition(callId: string, user: AuthenticatedUser, dto: SetCallDispositionDto) {
    const call = await this.prisma.call.findFirst({
      where:
        user.role === UserRole.admin
          ? { id: callId }
          : { id: callId, agent_id: user.id },
    });

    if (!call) {
      throw new NotFoundException("Call not found");
    }

    const targetStatus = DISPOSITION_TO_STATUS[dto.disposition];
    if (!this.callState.canTransition(call.status, targetStatus)) {
      throw new BadRequestException(
        `Cannot set disposition ${dto.disposition} from call status ${call.status}`,
      );
    }

    const disposition = await this.prisma.callDisposition.upsert({
      where: { call_id: callId },
      create: {
        call_id: callId,
        disposition: dto.disposition,
        notes: dto.notes?.trim(),
        set_by: user.id,
      },
      update: {
        disposition: dto.disposition,
        notes: dto.notes?.trim(),
        set_by: user.id,
      },
    });

    await this.prisma.callEvent.create({
      data: {
        call_id: callId,
        event_type: CallEventType.STATE_CHANGED,
        provider_event: `disposition:${dto.disposition}`,
        payload: {
          disposition: dto.disposition,
          notes: dto.notes,
          set_by: user.id,
        } as Prisma.InputJsonValue,
      },
    });

    if (call.status !== targetStatus) {
      await this.callState.transition(callId, targetStatus, {
        providerEvent: `agent_disposition:${dto.disposition}`,
        payload: { disposition: dto.disposition },
      });
    }

    return disposition;
  }
}
