import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, type RedisClientType } from "redis";

const DEDUPE_TTL_MS = 60_000;
const MEMORY_DEDUPE_MAX = 5_000;

@Injectable()
export class RealtimeEventDeduplicator implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RealtimeEventDeduplicator.name);
  private readonly memoryKeys = new Map<string, number>();
  private client?: RedisClientType;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.config.get<string>("REDIS_URL");
    if (!redisUrl || redisUrl.startsWith("YOUR_")) {
      this.logger.warn(
        JSON.stringify({
          message: "socket.dedupe.memory_fallback",
          reason: "REDIS_URL is not configured with a real URL",
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
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          message: "socket.dedupe.memory_fallback.invalid_redis_url",
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      return;
    }
    this.client.on("error", (error) =>
      this.logger.error(
        JSON.stringify({
          message: "socket.dedupe.redis.error",
          error: error instanceof Error ? error.message : String(error),
        }),
      ),
    );
    this.client.on("reconnecting", () =>
      this.logger.warn(JSON.stringify({ message: "socket.dedupe.redis.reconnecting" })),
    );
    await this.client.connect();
    this.logger.log(JSON.stringify({ message: "socket.dedupe.redis.connected" }));
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  async claim(key: string, ttlMs = DEDUPE_TTL_MS) {
    const namespacedKey = `fleetnexus:socket:event:${key}`;

    if (this.client?.isOpen) {
      const result = await this.client.set(namespacedKey, "1", { NX: true, PX: ttlMs });
      return result === "OK";
    }

    const now = Date.now();
    this.cleanupMemory(now);
    const expiresAt = this.memoryKeys.get(namespacedKey);
    if (expiresAt && expiresAt > now) return false;
    this.memoryKeys.set(namespacedKey, now + ttlMs);
    return true;
  }

  private cleanupMemory(now: number) {
    if (this.memoryKeys.size < MEMORY_DEDUPE_MAX) return;

    for (const [key, expiresAt] of this.memoryKeys) {
      if (expiresAt <= now || this.memoryKeys.size >= MEMORY_DEDUPE_MAX) {
        this.memoryKeys.delete(key);
      }
    }
  }
}
