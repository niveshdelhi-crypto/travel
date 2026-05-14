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
    this.healthInterval = setInterval(
      () => void this.logSocketHealth(),
      SOCKET_HEALTH_LOG_INTERVAL_MS,
    );
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
