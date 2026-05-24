import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { VonageService } from "../communications/vonage/vonage.service";
import { getSocketRedisConnected } from "../realtime/realtime-connection.registry";

export type PlatformModuleTone = "success" | "warning" | "danger";

export type PlatformModuleStatus = {
  name: string;
  status: string;
  tone: PlatformModuleTone;
  detail?: string;
};

type ModuleCounts = {
  users: bigint;
  leads: bigint;
  bookings: bigint;
  payments: bigint;
  calls: bigint;
  suppliers: bigint;
};

@Injectable()
export class AdminPlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly vonage: VonageService,
  ) {}

  async getModuleStatuses(): Promise<PlatformModuleStatus[]> {
    try {
      const counts = await this.fetchCounts();
      const vonageReady = this.vonage.isConfigured();

      return [
        this.countModule("Auth", Number(counts.users), "user"),
        this.countModule("Leads", Number(counts.leads), "lead"),
        this.countModule("Bookings", Number(counts.bookings), "booking"),
        this.countModule("Payments", Number(counts.payments), "ledger row"),
        {
          name: "Calls",
          status: "Operational",
          tone: "success",
          detail: vonageReady
            ? `${Number(counts.calls)} call${Number(counts.calls) === 1 ? "" : "s"} · Vonage ready`
            : `${Number(counts.calls)} call${Number(counts.calls) === 1 ? "" : "s"} · add Vonage env for outbound`,
        },
        this.countModule("Providers", Number(counts.suppliers), "supplier"),
        this.probeRealtime(),
      ];
    } catch (error) {
      if (this.isMissingTableError(error)) {
        return this.fallbackSchemaPending(error);
      }
      return this.fallbackUnavailable(error);
    }
  }

  /** One round-trip to Neon — avoids exhausting the Prisma connection pool. */
  private fetchCounts(): Promise<ModuleCounts> {
    return this.prisma.$queryRaw<ModuleCounts[]>`
      SELECT
        (SELECT COUNT(*)::bigint FROM users) AS users,
        (SELECT COUNT(*)::bigint FROM leads) AS leads,
        (SELECT COUNT(*)::bigint FROM bookings) AS bookings,
        (SELECT COUNT(*)::bigint FROM payments) AS payments,
        (SELECT COUNT(*)::bigint FROM calls) AS calls,
        (SELECT COUNT(*)::bigint FROM marketplace_suppliers) AS suppliers
    `.then((rows) => rows[0]);
  }

  private countModule(name: string, total: number, noun: string): PlatformModuleStatus {
    return {
      name,
      status: "Operational",
      tone: "success",
      detail: `${total} ${noun}${total === 1 ? "" : "s"}`,
    };
  }

  private probeRealtime(): PlatformModuleStatus {
    const redisUrl = this.config.get<string>("REDIS_URL")?.trim();
    const redisConfigured = Boolean(redisUrl) && !redisUrl!.startsWith("YOUR_");

    if (getSocketRedisConnected()) {
      return {
        name: "Realtime",
        status: "Operational",
        tone: "success",
        detail: "Socket.IO · Redis adapter",
      };
    }

    if (redisConfigured) {
      return {
        name: "Realtime",
        status: "Degraded",
        tone: "warning",
        detail: "REDIS_URL set but adapter not connected",
      };
    }

    return {
      name: "Realtime",
      status: "Operational",
      tone: "success",
      detail: "Socket.IO · single-node (no REDIS_URL)",
    };
  }

  private fallbackSchemaPending(error: unknown): PlatformModuleStatus[] {
    const detail =
      error instanceof Error ? error.message : "Run prisma migrate deploy in apps/api";
    return [
      ...["Auth", "Leads", "Bookings", "Payments", "Calls", "Providers"].map((name) => ({
        name,
        status: "Schema pending",
        tone: "warning" as const,
        detail,
      })),
      this.probeRealtime(),
    ];
  }

  private fallbackUnavailable(error: unknown): PlatformModuleStatus[] {
    const detail = this.shortError(error);
    return [
      ...["Auth", "Leads", "Bookings", "Payments", "Calls", "Providers"].map((name) => ({
        name,
        status: "Unavailable",
        tone: "danger" as const,
        detail,
      })),
      this.probeRealtime(),
    ];
  }

  private shortError(error: unknown): string {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return error.message.split("\n")[0] ?? error.message;
    }
    if (error instanceof Error) {
      if (/connection pool|Can't reach database|P1001/i.test(error.message)) {
        return "Database connection slow or unavailable — retry in a moment or wake Neon in console.";
      }
      return error.message.split("\n")[0] ?? error.message;
    }
    return String(error);
  }

  private isMissingTableError(error: unknown): boolean {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return error.code === "P2021" || error.code === "P2022";
    }
    const message = error instanceof Error ? error.message : String(error);
    return /does not exist|relation .* does not exist/i.test(message);
  }
}
