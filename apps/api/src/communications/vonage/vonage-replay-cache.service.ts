import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "crypto";
import { createClient, type RedisClientType } from "redis";
import {
  VONAGE_WEBHOOK_REPLAY_KEY_PREFIX,
  VONAGE_WEBHOOK_REPLAY_TTL_MS,
} from "./vonage-webhook.constants";

const MEMORY_REPLAY_MAX = 10_000;

@Injectable()
export class VonageReplayCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VonageReplayCacheService.name);
  private readonly memoryKeys = new Map<string, number>();
  private client?: RedisClientType;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.config.get<string>("REDIS_URL")?.trim();
    if (!redisUrl || redisUrl.startsWith("YOUR_")) {
      this.logger.warn(
        JSON.stringify({
          message: "vonage.webhook.replay.memory_fallback",
          reason: "REDIS_URL is not configured",
        }),
      );
      return;
    }

    try {
      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => Math.min(1_000 + retries * 250, 10_000),
        },
      });
      this.client.on("error", (error) =>
        this.logger.error(
          JSON.stringify({
            message: "vonage.webhook.replay.redis.error",
            error: error instanceof Error ? error.message : String(error),
          }),
        ),
      );
      await this.client.connect();
      this.logger.log(JSON.stringify({ message: "vonage.webhook.replay.redis.connected" }));
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          message: "vonage.webhook.replay.memory_fallback",
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      this.client = undefined;
    }
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  buildReplayKey(token: string, payloadHash: string, endpoint: string): string {
    const digest = createHash("sha256")
      .update(`${token}:${payloadHash}:${endpoint}`)
      .digest("hex");
    return `${VONAGE_WEBHOOK_REPLAY_KEY_PREFIX}${digest}`;
  }

  async claim(key: string, ttlMs = VONAGE_WEBHOOK_REPLAY_TTL_MS): Promise<boolean> {
    if (this.client?.isOpen) {
      const result = await this.client.set(key, "1", { NX: true, PX: ttlMs });
      return result === "OK";
    }

    const now = Date.now();
    this.cleanupMemory(now);
    const expiresAt = this.memoryKeys.get(key);
    if (expiresAt && expiresAt > now) return false;
    this.memoryKeys.set(key, now + ttlMs);
    return true;
  }

  private cleanupMemory(now: number) {
    if (this.memoryKeys.size < MEMORY_REPLAY_MAX) return;
    for (const [key, expiresAt] of this.memoryKeys) {
      if (expiresAt <= now || this.memoryKeys.size >= MEMORY_REPLAY_MAX) {
        this.memoryKeys.delete(key);
      }
    }
  }
}
