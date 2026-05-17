import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { LeadActivityAction, LeadStatus, Prisma, UserRole } from "@prisma/client";
import { createHash } from "crypto";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import type { CreateLeadDto } from "./dto/create-lead.dto";
import type { CreateLeadNoteDto, UpdateLeadDto } from "./dto/update-lead.dto";

const LEAD_TRANSACTION_OPTIONS = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  maxWait: 10_000,
  timeout: 20_000,
};

const ASSIGNMENT_LOCK_KEY = "fleetnexus:lead-assignment";
const MAX_TRANSACTION_RETRIES = 5;
const IDEMPOTENCY_WAIT_MS = 10_000;
const IDEMPOTENCY_POLL_MS = 150;

type PublicLeadResponse = {
  success: true;
  message: string;
  leadId: string;
  status: LeadStatus;
};

type PublicLeadOptions = {
  idempotencyKey?: string;
  requestId?: string;
};

type LeadListOptions = {
  page?: number;
  pageSize?: number;
  status?: string;
};

const leadInclude = {
  assigned_agent: {
    select: {
      id: true,
      name: true,
      email: true,
      current_lead_count: true,
    },
  },
  notes: {
    orderBy: { created_at: "desc" },
    take: 20,
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  },
  activities: {
    orderBy: { created_at: "desc" },
    take: 30,
    include: {
      performer: { select: { id: true, name: true, email: true } },
    },
  },
} satisfies Prisma.LeadInclude;

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async createFromLandingPage(dto: CreateLeadDto, options: PublicLeadOptions = {}) {
    const startedAt = Date.now();
    this.validateLeadDates(dto);
    const idempotencyKey = this.normalizeIdempotencyKey(options.idempotencyKey);
    const requestHash = this.hashSubmission(dto);

    if (idempotencyKey) {
      const existing = await this.reserveIdempotencyKey(idempotencyKey, requestHash);
      if (existing) return existing;
    }

    let result: { leadId: string; response: PublicLeadResponse };

    try {
      result = await this.withTransactionRetry(async (attempt) => {
        const txStartedAt = Date.now();

        return this.prisma.$transaction(async (tx) => {
          const lockStartedAt = Date.now();
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ASSIGNMENT_LOCK_KEY}))`;

          const assignedAgent = await this.findLowestLoadAgent(tx);
          this.logInfo("lead.assignment.selected", {
            requestId: options.requestId,
            attempt,
            agentId: assignedAgent.id,
            currentLeadCount: assignedAgent.current_lead_count,
            lockWaitMs: Date.now() - lockStartedAt,
          });

          const created = await tx.lead.create({
            data: {
              pickup_location: dto.pickup_location.trim(),
              drop_location: dto.drop_location.trim(),
              pickup_datetime: new Date(dto.pickup_datetime),
              return_datetime: new Date(dto.return_datetime),
              customer_name: dto.customer_name.trim(),
              customer_email: dto.customer_email.toLowerCase().trim(),
              customer_phone: dto.customer_phone.trim(),
              assigned_to: assignedAgent.id,
            },
            select: { id: true, status: true, assigned_to: true },
          });

          await tx.leadActivity.createMany({
            data: [
              {
                lead_id: created.id,
                action: LeadActivityAction.LEAD_CREATED,
                metadata: {
                  source: "landing_page",
                  request_id: options.requestId,
                  driver_age: dto.driver_age?.trim() || undefined,
                  residency: dto.residency?.trim() || undefined,
                },
              },
              {
                lead_id: created.id,
                action: LeadActivityAction.LEAD_ASSIGNED,
                performed_by: assignedAgent.id,
                metadata: {
                  assigned_to: assignedAgent.id,
                  assignment_strategy: "advisory_lock_lowest_denormalized_load",
                  request_id: options.requestId,
                },
              },
            ],
          });

          await tx.user.update({
            where: { id: assignedAgent.id },
            data: { current_lead_count: { increment: 1 } },
          });

          const response = this.toPublicLeadResponse(created.id, created.status);

          if (idempotencyKey) {
            await tx.leadSubmission.update({
              where: { key: idempotencyKey },
              data: {
                lead_id: created.id,
                response: response as Prisma.InputJsonValue,
              },
            });
          }

          this.logInfo("lead.create.transaction.completed", {
            requestId: options.requestId,
            attempt,
            leadId: created.id,
            assignedAgentId: created.assigned_to,
            durationMs: Date.now() - txStartedAt,
          });

          return { leadId: created.id, response };
        }, LEAD_TRANSACTION_OPTIONS);
      }, options.requestId);
    } catch (error) {
      if (idempotencyKey) {
        await this.prisma.leadSubmission.deleteMany({
          where: { key: idempotencyKey, lead_id: null },
        });
      }
      throw error;
    }

    void this.emitCreatedLead(result.leadId, options.requestId);

    this.logInfo("lead.create.public.completed", {
      requestId: options.requestId,
      leadId: result.leadId,
      idempotencyKey: idempotencyKey ? this.redactKey(idempotencyKey) : undefined,
      durationMs: Date.now() - startedAt,
    });

    return result.response;
  }

  private async emitCreatedLead(leadId: string, requestId?: string) {
    try {
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
        include: leadInclude,
      });

      if (lead) {
        this.realtime.emitLeadCreated(lead);
        this.realtime.emitLeadAssigned(lead);
      }
    } catch (error) {
      this.logWarn("lead.realtime.emit_failed", {
        requestId,
        leadId,
        error: this.errorSummary(error),
      });
    }
  }

  private toPublicLeadResponse(leadId: string, status: LeadStatus): PublicLeadResponse {
    return {
      success: true,
      message: "Lead created and assigned successfully",
      leadId,
      status,
    };
  }

  async listForUser(user: AuthenticatedUser, options: LeadListOptions = {}) {
    return this.paginateLeads(
      user.role === UserRole.admin ? {} : { assigned_to: user.id },
      options,
    );
  }

  async listMyLeads(user: AuthenticatedUser, options: LeadListOptions = {}) {
    return this.paginateLeads({ assigned_to: user.id }, options);
  }

  async listAdminLeads(user: AuthenticatedUser, options: LeadListOptions = {}) {
    if (user.role !== UserRole.admin) throw new ForbiddenException("Admin role required");

    return this.paginateLeads({}, options);
  }

  async getOne(id: string, user: AuthenticatedUser) {
    const lead = await this.prisma.lead.findFirst({
      where: this.accessWhere(id, user),
      include: leadInclude,
    });

    if (!lead) throw new NotFoundException("Lead not found");
    return lead;
  }

  async update(id: string, user: AuthenticatedUser, dto: UpdateLeadDto) {
    await this.getOne(id, user);

    const existing = await this.prisma.lead.findUniqueOrThrow({
      where: { id },
      select: { status: true, assigned_to: true },
    });
    const nextStatus = dto.status ?? existing.status;

    if (
      existing.status === LeadStatus.CONFIRMED &&
      nextStatus === LeadStatus.COMPLETED &&
      dto.status === LeadStatus.COMPLETED
    ) {
      const booked = await this.prisma.booking.findUnique({
        where: { lead_id: id },
        select: { id: true },
      });
      if (!booked) {
        throw new BadRequestException(
          "Record corridor revenue via POST /api/bookings/close-lead before completing a confirmed lead.",
        );
      }
    }

    if (
      existing.assigned_to &&
      existing.status !== LeadStatus.COMPLETED &&
      nextStatus === LeadStatus.COMPLETED
    ) {
      await this.prisma.user.update({
        where: { id: existing.assigned_to },
        data: { current_lead_count: { decrement: 1 } },
      });
    }

    if (
      existing.assigned_to &&
      existing.status === LeadStatus.COMPLETED &&
      nextStatus !== LeadStatus.COMPLETED
    ) {
      await this.prisma.user.update({
        where: { id: existing.assigned_to },
        data: { current_lead_count: { increment: 1 } },
      });
    }

    const followUpAt =
      dto.follow_up_at === undefined
        ? undefined
        : dto.follow_up_at === null || dto.follow_up_at === ""
          ? null
          : new Date(dto.follow_up_at);
    if (followUpAt !== undefined && followUpAt !== null && Number.isNaN(followUpAt.getTime())) {
      throw new BadRequestException("follow_up_at must be a valid ISO datetime");
    }

    const lead = await this.prisma.lead.update({
      where: { id },
      data: {
        status: nextStatus,
        booking_value: dto.booking_value == null ? undefined : new Prisma.Decimal(dto.booking_value),
        last_contacted_at:
          dto.status === LeadStatus.CONTACTED || dto.status === LeadStatus.NEGOTIATING
            ? new Date()
            : undefined,
        ...(followUpAt !== undefined ? { follow_up_at: followUpAt } : {}),
      },
      include: leadInclude,
    });

    if (dto.status && dto.status !== existing.status) {
      await this.prisma.leadActivity.create({
        data: {
          lead_id: id,
          action: LeadActivityAction.STATUS_UPDATED,
          performed_by: user.id,
          metadata: {
            from: existing.status,
            to: dto.status,
          },
        },
      });
    }

    this.realtime.emitLeadUpdated(lead);
    return lead;
  }

  async updateStatus(id: string, user: AuthenticatedUser, status: LeadStatus) {
    return this.update(id, user, { status });
  }

  async remove(id: string, user: AuthenticatedUser) {
    const existing = await this.prisma.lead.findFirst({
      where: this.accessWhere(id, user),
      select: { id: true, assigned_to: true, status: true },
    });

    if (!existing) throw new NotFoundException("Lead not found");

    if (existing.assigned_to && existing.status !== LeadStatus.COMPLETED) {
      await this.prisma.user.update({
        where: { id: existing.assigned_to },
        data: { current_lead_count: { decrement: 1 } },
      });
    }

    await this.prisma.lead.delete({ where: { id: existing.id } });
    this.realtime.emitLeadDeleted({
      id: existing.id,
      assigned_to: existing.assigned_to,
    });
  }

  async addNote(id: string, user: AuthenticatedUser, dto: CreateLeadNoteDto) {
    await this.getOne(id, user);

    const note = await this.prisma.leadNote.create({
      data: {
        lead_id: id,
        author_id: user.id,
        body: dto.body.trim(),
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });

    await this.createActivity(id, LeadActivityAction.NOTE_ADDED, user.id, {
      note_id: note.id,
    });

    this.realtime.emitNoteCreated(note);
    return note;
  }

  async recordCall(id: string, user: AuthenticatedUser) {
    const lead = await this.update(id, user, { status: LeadStatus.CONTACTED });
    await this.createActivity(id, LeadActivityAction.CALL_LOGGED, user.id);
    return lead;
  }

  async metrics(user: AuthenticatedUser) {
    const leadWhere: Prisma.LeadWhereInput =
      user.role === UserRole.admin ? {} : { assigned_to: user.id };

    const [statusCounts, activeAgents, revenue, totalLeads, convertedLeads] = await Promise.all([
      this.prisma.lead.groupBy({ by: ["status"], where: leadWhere, _count: { _all: true } }),
      this.prisma.user.findMany({
        where: { role: UserRole.sales_agent, is_active: true },
        select: { id: true, name: true, email: true, current_lead_count: true },
        orderBy: [{ current_lead_count: "asc" }, { created_at: "asc" }],
      }),
      this.prisma.lead.aggregate({
        where: {
          ...leadWhere,
          status: { in: [LeadStatus.CONFIRMED, LeadStatus.COMPLETED] },
        },
        _sum: { booking_value: true },
      }),
      this.prisma.lead.count({ where: leadWhere }),
      this.prisma.lead.count({
        where: {
          ...leadWhere,
          status: { in: [LeadStatus.CONFIRMED, LeadStatus.COMPLETED] },
        },
      }),
    ]);
    const counts = Object.fromEntries(statusCounts.map((item) => [item.status, item._count._all]));

    return {
      statusCounts: {
        [LeadStatus.NEW]: counts[LeadStatus.NEW] ?? 0,
        [LeadStatus.CONTACTED]: counts[LeadStatus.CONTACTED] ?? 0,
        [LeadStatus.NEGOTIATING]: counts[LeadStatus.NEGOTIATING] ?? 0,
        [LeadStatus.CONFIRMED]: counts[LeadStatus.CONFIRMED] ?? 0,
        [LeadStatus.COMPLETED]: counts[LeadStatus.COMPLETED] ?? 0,
      },
      totalLeads,
      activeAgents,
      revenue: Number(revenue._sum.booking_value ?? 0),
      conversion: totalLeads === 0 ? 0 : Math.round((convertedLeads / totalLeads) * 1000) / 10,
      bookings: convertedLeads,
      activeCalls: 0,
    };
  }

  private accessWhere(id: string, user: AuthenticatedUser): Prisma.LeadWhereInput {
    return user.role === UserRole.admin ? { id } : { id, assigned_to: user.id };
  }

  private async paginateLeads(baseWhere: Prisma.LeadWhereInput, options: LeadListOptions) {
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(100, Math.max(10, options.pageSize ?? 25));
    const status = this.parseLeadStatus(options.status);
    const where: Prisma.LeadWhereInput = {
      ...baseWhere,
      ...(status ? { status } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: leadInclude,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  private parseLeadStatus(status?: string) {
    if (!status) return undefined;
    if (!Object.values(LeadStatus).includes(status as LeadStatus)) {
      throw new BadRequestException("Invalid lead status filter");
    }
    return status as LeadStatus;
  }

  private validateLeadDates(dto: CreateLeadDto) {
    const pickupDate = new Date(dto.pickup_datetime);
    const returnDate = new Date(dto.return_datetime);

    if (Number.isNaN(pickupDate.getTime()) || Number.isNaN(returnDate.getTime())) {
      throw new BadRequestException("Invalid pickup or return date");
    }

    if (returnDate <= pickupDate) {
      throw new BadRequestException("Return date must be after pickup date");
    }
  }

  private async createActivity(
    leadId: string,
    action: LeadActivityAction,
    performedBy?: string | null,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.prisma.leadActivity.create({
      data: {
        lead_id: leadId,
        action,
        performed_by: performedBy ?? undefined,
        metadata,
      },
    });
  }

  private async findLowestLoadAgent(tx: Prisma.TransactionClient) {
    const agent = await tx.user.findFirst({
      where: { role: UserRole.sales_agent, is_active: true },
      select: { id: true, current_lead_count: true, created_at: true },
      orderBy: [{ current_lead_count: "asc" }, { created_at: "asc" }],
      take: 1,
    });

    if (!agent) throw new ServiceUnavailableException("No active sales agents available");
    return agent;
  }

  private async withTransactionRetry<T>(operation: (attempt: number) => Promise<T>, requestId?: string) {
    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_TRANSACTION_RETRIES; attempt += 1) {
      try {
        return await operation(attempt);
      } catch (error) {
        lastError = error;
        if (!this.isRetryableTransactionError(error)) {
          throw error;
        }

        if (attempt === MAX_TRANSACTION_RETRIES) {
          this.logWarn("lead.transaction.retries_exhausted", {
            requestId,
            attempt,
            error: this.errorSummary(error),
          });
          throw new ConflictException(
            "Lead creation conflicted with concurrent writes after retries. Retry with the same Idempotency-Key.",
          );
        }

        const delayMs = this.retryDelay(attempt);
        this.logWarn("lead.transaction.retry", {
          requestId,
          attempt,
          nextAttempt: attempt + 1,
          delayMs,
          error: this.errorSummary(error),
        });
        await this.sleep(delayMs);
      }
    }

    throw lastError;
  }

  private isRetryableTransactionError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return true;
    }

    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    return (
      message.includes("could not serialize access") ||
      message.includes("serialization failure") ||
      message.includes("deadlock detected") ||
      message.includes("write conflict") ||
      message.includes("transaction conflict")
    );
  }

  private retryDelay(attempt: number) {
    const baseMs = 50;
    const capMs = 1_000;
    const exponentialMs = Math.min(capMs, baseMs * 2 ** attempt);
    return exponentialMs + Math.floor(Math.random() * exponentialMs);
  }

  private async reserveIdempotencyKey(key: string, requestHash: string) {
    try {
      await this.prisma.leadSubmission.create({
        data: { key, request_hash: requestHash },
        select: { id: true },
      });
      return null;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
        throw error;
      }
    }

    const submission = await this.waitForIdempotentResult(key);
    if (!submission) {
      throw new ConflictException("Lead submission is already in progress for this Idempotency-Key");
    }

    if (submission.request_hash !== requestHash) {
      throw new ConflictException("Idempotency-Key was already used with a different request body");
    }

    if (!this.isPublicLeadResponse(submission.response)) {
      throw new ConflictException("Lead submission is still in progress for this Idempotency-Key");
    }

    return submission.response;
  }

  private async waitForIdempotentResult(key: string) {
    const deadline = Date.now() + IDEMPOTENCY_WAIT_MS;

    while (Date.now() < deadline) {
      const submission = await this.prisma.leadSubmission.findUnique({
        where: { key },
        select: { request_hash: true, response: true },
      });

      if (!submission) return null;
      if (submission.response) return submission;
      await this.sleep(IDEMPOTENCY_POLL_MS);
    }

    return this.prisma.leadSubmission.findUnique({
      where: { key },
      select: { request_hash: true, response: true },
    });
  }

  private normalizeIdempotencyKey(key?: string) {
    const normalized = key?.trim();
    if (!normalized) return undefined;
    if (normalized.length < 8 || normalized.length > 200) {
      throw new BadRequestException("Idempotency-Key must be between 8 and 200 characters");
    }
    return normalized;
  }

  private hashSubmission(dto: CreateLeadDto) {
    const stablePayload = {
      pickup_location: dto.pickup_location.trim(),
      drop_location: dto.drop_location.trim(),
      pickup_datetime: new Date(dto.pickup_datetime).toISOString(),
      return_datetime: new Date(dto.return_datetime).toISOString(),
      customer_name: dto.customer_name.trim(),
      customer_email: dto.customer_email.toLowerCase().trim(),
      customer_phone: dto.customer_phone.trim(),
    };

    return createHash("sha256").update(JSON.stringify(stablePayload)).digest("hex");
  }

  private isPublicLeadResponse(value: Prisma.JsonValue): value is PublicLeadResponse {
    return (
      !!value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as Record<string, unknown>).success === true &&
      typeof (value as Record<string, unknown>).leadId === "string" &&
      typeof (value as Record<string, unknown>).status === "string"
    );
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private logInfo(message: string, data: Record<string, unknown>) {
    this.logger.log(JSON.stringify({ message, ...data }));
  }

  private logWarn(message: string, data: Record<string, unknown>) {
    this.logger.warn(JSON.stringify({ message, ...data }));
  }

  private errorSummary(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { code: error.code, message: error.message };
    }
    return { message: error instanceof Error ? error.message : String(error) };
  }

  private redactKey(key: string) {
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  }
}
