import { Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { randomUUID } from "crypto";
import {
  OnGatewayDisconnect,
  ConnectedSocket,
  OnGatewayInit,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { UserRole } from "@prisma/client";
import { Server, Socket } from "socket.io";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeEventDeduplicator } from "./realtime-event-deduplicator.service";
import { isWebOriginAllowed } from "../common/http/web-origin-policy";

type SocketUser = {
  id: string;
  email: string;
  role: UserRole;
};

type AccessTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
  sid: string;
};

type RealtimeMetadata = {
  eventId: string;
  emittedAt: string;
};

type RealtimePayload<T> = T & {
  _realtime?: RealtimeMetadata;
};

type CallRealtimePayload = {
  id: string;
  status: string;
  direction: string;
  agent_id: string | null;
  lead_id: string | null;
  provider_call_id: string | null;
};

type PaymentRealtimePayload = {
  id: string;
  booking_id: string;
  status: string;
  amount?: number;
  currency?: string;
  gateway_type?: string;
  assigned_to?: string | null;
  lead_id?: string;
  failure_reason?: string;
};

type BookingRealtimePayload = {
  id: string;
  lead_id: string;
  status: string;
  lifecycle_status?: string;
  assigned_to?: string | null;
};

type DocumentRealtimePayload = {
  id: string;
  booking_id: string;
  lead_id?: string;
  invoice_number?: string;
  voucher_number?: string;
  pdf_url?: string | null;
};

type RefundRealtimePayload = {
  id: string;
  booking_id: string;
  status: string;
  amount?: number;
};

const SOCKET_HEALTH_LOG_INTERVAL_MS = 60_000;
const STALE_UNAUTHENTICATED_SOCKET_MS = 10_000;
const EVENT_DEDUPE_TTL_MS = 60_000;
const FAST_EVENT_DEDUPE_TTL_MS = 1_000;

@WebSocketGateway({
  namespace: "leads",
  cors: {
    origin: (origin, callback) => {
      callback(null, isWebOriginAllowed(origin));
    },
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayInit<Server>, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private healthInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly deduplicator: RealtimeEventDeduplicator,
  ) {}

  afterInit() {
    const healthLogMs =
      this.config.get<string>("NODE_ENV") === "production"
        ? SOCKET_HEALTH_LOG_INTERVAL_MS
        : 5 * 60_000;

    this.healthInterval = setInterval(() => void this.logSocketHealth(), healthLogMs);
    this.cleanupInterval = setInterval(
      () => this.cleanupStaleSockets(),
      SOCKET_HEALTH_LOG_INTERVAL_MS,
    );
    this.logger.log(JSON.stringify({ message: "socket.gateway.initialized", namespace: "leads" }));
  }

  async handleConnection(socket: Socket) {
    socket.data.connectedAt = Date.now();
    socket.data.lastSeenAt = Date.now();
    socket.use((_packet, next) => {
      socket.data.lastSeenAt = Date.now();
      next();
    });

    const user = await this.authenticate(socket);

    if (!user) {
      this.logger.warn(
        JSON.stringify({
          message: "socket.connection.rejected",
          socketId: socket.id,
          ip: socket.handshake.address,
        }),
      );
      socket.disconnect(true);
      return;
    }

    socket.data.user = user;
    await socket.join(`user:${user.id}`);
    await socket.join(`role:${user.role}`);
    this.logger.log(
      JSON.stringify({
        message: "socket.connected",
        socketId: socket.id,
        userId: user.id,
        role: user.role,
        transport: socket.conn.transport.name,
      }),
    );
  }

  handleDisconnect(socket: Socket) {
    const user = socket.data.user as SocketUser | undefined;
    this.logger.log(
      JSON.stringify({
        message: "socket.disconnected",
        socketId: socket.id,
        userId: user?.id,
        reason: socket.disconnected ? "client_or_transport_disconnect" : "unknown",
        lifetimeMs: Date.now() - Number(socket.data.connectedAt ?? Date.now()),
      }),
    );
  }

  onModuleDestroy() {
    if (this.healthInterval) clearInterval(this.healthInterval);
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
  }

  @SubscribeMessage("lead:watch")
  async watchLead(@ConnectedSocket() socket: Socket, @MessageBody() leadId: string) {
    const user = socket.data.user as SocketUser | undefined;
    if (!user || !leadId) return { ok: false };

    const lead = await this.prisma.lead.findFirst({
      where: user.role === UserRole.admin ? { id: leadId } : { id: leadId, assigned_to: user.id },
      select: { id: true },
    });

    if (!lead) return { ok: false };
    await socket.join(`lead:${leadId}`);
    this.logger.log(
      JSON.stringify({
        message: "socket.room.joined",
        socketId: socket.id,
        userId: user.id,
        room: `lead:${leadId}`,
      }),
    );
    return { ok: true };
  }

  emitLeadCreated(lead: unknown) {
    const typedLead = lead as { id?: string };
    void this.emitDeduped({
      eventName: "lead.created",
      dedupeKey: `lead.created:${typedLead.id ?? randomUUID()}`,
      rooms: ["role:admin"],
      payload: lead,
    });
    void this.emitMetricsChanged();
  }

  emitLeadAssigned(lead: { id: string; assigned_to: string | null }) {
    void this.emitDeduped({
      eventName: "lead.assigned",
      dedupeKey: `lead.assigned:${lead.id}:${lead.assigned_to ?? "unassigned"}`,
      rooms: ["role:admin"],
      payload: lead,
    });
    if (lead.assigned_to) {
      void this.emitDeduped({
        eventName: "lead.assigned",
        dedupeKey: `lead.assigned.user:${lead.id}:${lead.assigned_to}`,
        rooms: [`user:${lead.assigned_to}`],
        payload: lead,
      });
      void this.emitDeduped({
        eventName: "notification.created",
        dedupeKey: `notification.lead_assigned:${lead.id}:${lead.assigned_to}`,
        rooms: [`user:${lead.assigned_to}`],
        payload: {
          type: "lead_assigned",
          leadId: lead.id,
          message: "New rental lead assigned",
        },
      });
    }
    void this.emitMetricsChanged();
  }

  emitLeadUpdated(lead: { id: string; assigned_to: string | null }) {
    void this.emitDeduped({
      eventName: "lead.updated",
      dedupeKey: `lead.updated:${lead.id}`,
      rooms: ["role:admin", `lead:${lead.id}`],
      payload: lead,
      ttlMs: FAST_EVENT_DEDUPE_TTL_MS,
    });
    if (lead.assigned_to) {
      void this.emitDeduped({
        eventName: "lead.updated",
        dedupeKey: `lead.updated.user:${lead.id}:${lead.assigned_to}`,
        rooms: [`user:${lead.assigned_to}`],
        payload: lead,
        ttlMs: FAST_EVENT_DEDUPE_TTL_MS,
      });
    }
    void this.emitMetricsChanged();
  }

  emitLeadDeleted(payload: { id: string; assigned_to: string | null }) {
    void this.emitDeduped({
      eventName: "lead.deleted",
      dedupeKey: `lead.deleted:${payload.id}`,
      rooms: [
        "role:admin",
        ...(payload.assigned_to ? [`user:${payload.assigned_to}` as const] : []),
      ],
      payload,
      ttlMs: FAST_EVENT_DEDUPE_TTL_MS,
    });
    void this.emitMetricsChanged();
  }

  emitNoteCreated(note: { id?: string; lead_id: string }) {
    void this.emitDeduped({
      eventName: "lead.note.created",
      dedupeKey: `lead.note.created:${note.id ?? note.lead_id}`,
      rooms: ["role:admin", `lead:${note.lead_id}`],
      payload: note,
    });
  }

  emitCallCreated(payload: CallRealtimePayload) {
    void this.emitCallEvent("CALL_CREATED", payload);
  }

  emitCallRinging(payload: CallRealtimePayload) {
    void this.emitCallEvent("CALL_RINGING", payload);
  }

  emitCallAnswered(payload: CallRealtimePayload) {
    void this.emitCallEvent("CALL_ANSWERED", payload);
  }

  emitCallCompleted(payload: CallRealtimePayload) {
    void this.emitCallEvent("CALL_COMPLETED", payload);
  }

  emitCallFailed(payload: CallRealtimePayload & { failure_reason?: string | null }) {
    void this.emitCallEvent("CALL_FAILED", payload);
  }

  emitPaymentCreated(payload: PaymentRealtimePayload) {
    void this.emitPaymentEvent("PAYMENT_CREATED", payload);
  }

  emitPaymentSuccess(payload: PaymentRealtimePayload) {
    void this.emitPaymentEvent("PAYMENT_SUCCESS", payload);
  }

  emitPaymentFailed(payload: PaymentRealtimePayload & { failure_reason?: string }) {
    void this.emitPaymentEvent("PAYMENT_FAILED", payload);
  }

  emitBookingConfirmed(payload: BookingRealtimePayload) {
    void this.emitDeduped({
      eventName: "BOOKING_CONFIRMED",
      dedupeKey: `BOOKING_CONFIRMED:${payload.id}`,
      rooms: this.bookingRealtimeRooms(payload),
      payload,
    });
  }

  emitBookingCreated(payload: BookingRealtimePayload) {
    void this.emitDeduped({
      eventName: "BOOKING_CREATED",
      dedupeKey: `BOOKING_CREATED:${payload.id}`,
      rooms: this.bookingRealtimeRooms(payload),
      payload,
    });
  }

  emitBookingFailed(payload: BookingRealtimePayload) {
    void this.emitDeduped({
      eventName: "BOOKING_FAILED",
      dedupeKey: `BOOKING_FAILED:${payload.id}`,
      rooms: this.bookingRealtimeRooms(payload),
      payload,
    });
  }

  emitInvoiceGenerated(payload: DocumentRealtimePayload) {
    void this.emitDeduped({
      eventName: "INVOICE_GENERATED",
      dedupeKey: `INVOICE_GENERATED:${payload.id}`,
      rooms: this.bookingRealtimeRooms({
        id: payload.booking_id,
        lead_id: payload.lead_id ?? "",
        status: payload.invoice_number ?? "INVOICE",
      }),
      payload,
    });
  }

  emitVoucherGenerated(payload: DocumentRealtimePayload) {
    void this.emitDeduped({
      eventName: "VOUCHER_GENERATED",
      dedupeKey: `VOUCHER_GENERATED:${payload.id}`,
      rooms: this.bookingRealtimeRooms({
        id: payload.booking_id,
        lead_id: payload.lead_id ?? "",
        status: payload.voucher_number ?? "VOUCHER",
      }),
      payload,
    });
  }

  emitRefundCreated(payload: RefundRealtimePayload) {
    void this.emitDeduped({
      eventName: "REFUND_CREATED",
      dedupeKey: `REFUND_CREATED:${payload.id}`,
      rooms: ["role:admin", "role:finance_admin"],
      payload,
    });
  }

  emitRefundCompleted(payload: RefundRealtimePayload) {
    void this.emitDeduped({
      eventName: "REFUND_COMPLETED",
      dedupeKey: `REFUND_COMPLETED:${payload.id}`,
      rooms: ["role:admin", "role:finance_admin"],
      payload,
    });
  }

  private emitPaymentEvent(eventName: string, payload: PaymentRealtimePayload) {
    void this.emitDeduped({
      eventName,
      dedupeKey: `${eventName}:${payload.id}:${payload.status}`,
      rooms: this.paymentRealtimeRooms(payload),
      payload,
    });
  }

  private paymentRealtimeRooms(payload: PaymentRealtimePayload): string[] {
    const rooms = new Set<string>(["role:admin", "role:finance_admin"]);
    if (payload.assigned_to) {
      rooms.add(`user:${payload.assigned_to}`);
    }
    if (payload.booking_id) {
      rooms.add(`lead:${payload.lead_id ?? payload.booking_id}`);
    }
    return [...rooms];
  }

  private bookingRealtimeRooms(payload: BookingRealtimePayload): string[] {
    const rooms = new Set<string>(["role:admin", "role:finance_admin", "role:operations_manager"]);
    if (payload.assigned_to) {
      rooms.add(`user:${payload.assigned_to}`);
    }
    if (payload.lead_id) {
      rooms.add(`lead:${payload.lead_id}`);
    }
    return [...rooms];
  }

  private emitCallEvent(eventName: string, payload: CallRealtimePayload) {
    const rooms = this.callRealtimeRooms(payload);
    void this.emitDeduped({
      eventName,
      dedupeKey: `${eventName}:${payload.id}:${payload.status}`,
      rooms,
      payload,
    });
  }

  private callRealtimeRooms(payload: CallRealtimePayload): string[] {
    const rooms = new Set<string>(["role:admin"]);
    if (payload.agent_id) {
      rooms.add(`user:${payload.agent_id}`);
    }
    if (payload.lead_id) {
      rooms.add(`lead:${payload.lead_id}`);
    }
    return [...rooms];
  }

  private async authenticate(socket: Socket): Promise<SocketUser | null> {
    const token = this.extractToken(socket);
    if (!token) return null;

    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
      });
      const session = await this.prisma.refreshSession.findFirst({
        where: {
          id: payload.sid,
          user_id: payload.sub,
          revoked_at: null,
          expires_at: { gt: new Date() },
          user: { is_active: true },
        },
        include: { user: true },
      });

      if (!session) return null;
      return {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      };
    } catch {
      return null;
    }
  }

  private extractToken(socket: Socket) {
    const authToken = socket.handshake.auth?.token;
    if (typeof authToken === "string" && authToken) return authToken;

    const cookieHeader = socket.handshake.headers.cookie ?? "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((cookie) => {
        const [key, ...value] = cookie.trim().split("=");
        return [key, decodeURIComponent(value.join("="))];
      }),
    );

    return cookies.access_token;
  }

  private async emitMetricsChanged() {
    await this.emitDeduped({
      eventName: "metrics.changed",
      dedupeKey: `metrics.changed:${Math.floor(Date.now() / FAST_EVENT_DEDUPE_TTL_MS)}`,
      rooms: ["role:admin"],
      payload: {},
      ttlMs: FAST_EVENT_DEDUPE_TTL_MS,
    });
  }

  private async emitDeduped<T>({
    eventName,
    dedupeKey,
    rooms,
    payload,
    ttlMs = EVENT_DEDUPE_TTL_MS,
  }: {
    eventName: string;
    dedupeKey: string;
    rooms: string[];
    payload: T;
    ttlMs?: number;
  }) {
    const claimed = await this.deduplicator.claim(dedupeKey, ttlMs);
    if (!claimed) {
      this.logger.warn(JSON.stringify({ message: "socket.event.deduped", eventName, dedupeKey }));
      return;
    }

    const eventId = randomUUID();
    const realtimePayload = this.withRealtimeMetadata(payload, {
      eventId,
      emittedAt: new Date().toISOString(),
    });
    let target: { to: (room: string) => typeof target; emit: (event: string, payload: unknown) => void } =
      this.server as never;
    for (const room of rooms) {
      target = target.to(room);
    }
    target.emit(eventName, realtimePayload);
    this.logger.log(
      JSON.stringify({
        message: "socket.event.emitted",
        eventName,
        eventId,
        rooms,
      }),
    );
  }

  private withRealtimeMetadata<T>(payload: T, metadata: RealtimeMetadata): RealtimePayload<T> {
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      return { ...(payload as T & object), _realtime: metadata } as RealtimePayload<T>;
    }

    return { _realtime: metadata } as RealtimePayload<T>;
  }

  private async logSocketHealth() {
    try {
      const sockets = await this.server.fetchSockets();
      this.logger.log(
        JSON.stringify({
          message: "socket.health",
          namespace: "leads",
          connectedSockets: sockets.length,
          localSockets: this.localSockets().length,
          rooms: this.roomCount(),
        }),
      );
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          message: "socket.health.failed",
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }

  private cleanupStaleSockets() {
    const now = Date.now();

    for (const socket of this.localSockets()) {
      const hasUser = Boolean(socket.data.user);
      const connectedAt = Number(socket.data.connectedAt ?? now);

      if (!hasUser && now - connectedAt > STALE_UNAUTHENTICATED_SOCKET_MS) {
        this.logger.warn(
          JSON.stringify({
            message: "socket.cleanup.stale_unauthenticated",
            socketId: socket.id,
            ageMs: now - connectedAt,
          }),
        );
        socket.disconnect(true);
      }
    }
  }

  private localSockets() {
    const namespace = this.server as unknown as { sockets?: Map<string, Socket> };
    return Array.from(namespace.sockets?.values() ?? []);
  }

  private roomCount() {
    const namespace = this.server as unknown as { adapter?: { rooms?: Map<string, unknown> } };
    return namespace.adapter?.rooms?.size ?? 0;
  }
}
