import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, type RedisClientType } from "redis";

const MEMORY_REPLAY_MAX = 10_000;
const REPLAY_TTL_MS = 300_000;

@Injectable()
export class TelnyxReplayCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelnyxReplayCacheService.name);
  private readonly memoryKeys = new Map<string, number>();
  private client?: RedisClientType;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.config.get<string>("REDIS_URL")?.trim();
    if (!redisUrl || redisUrl.startsWith("YOUR_")) return;

    try {
      this.client = createClient({ url: redisUrl });
      this.client.on("error", (error) =>
        this.logger.error(
          JSON.stringify({
            message: "telnyx.webhook.replay.redis.error",
            error: error instanceof Error ? error.message : String(error),
          }),
        ),
      );
      await this.client.connect();
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          message: "telnyx.webhook.replay.memory_fallback",
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      this.client = undefined;
    }
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  buildReplayKey(replayKey: string, endpoint: string): string {
    return `telnyx:webhook:${endpoint}:${replayKey}`;
  }

  async claim(key: string, ttlMs = REPLAY_TTL_MS): Promise<boolean> {
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
