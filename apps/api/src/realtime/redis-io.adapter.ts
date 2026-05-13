import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient, type RedisClientType } from "redis";
import { ServerOptions } from "socket.io";

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor?: ReturnType<typeof createAdapter>;
  private pubClient?: RedisClientType;
  private subClient?: RedisClientType;

  async connectToRedis(config: ConfigService) {
    const redisUrlRaw = config.get<string>("REDIS_URL");
    const redisUrl = redisUrlRaw?.trim();

    if (!redisUrl || redisUrl.startsWith("YOUR_")) {
      this.logger.warn(
        JSON.stringify({
          message: "socket.redis.disabled",
          reason: "REDIS_URL is not configured with a real URL; Socket.IO rooms are process-local",
        }),
      );
      return;
    }

    try {
      this.pubClient = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => Math.min(1_000 + retries * 250, 10_000),
        },
      });
    } catch (error) {
      this.logRedisError("socket.redis.disabled.invalid_url", error);
      return;
    }
    this.subClient = this.pubClient.duplicate();

    this.pubClient.on("error", (error) => this.logRedisError("socket.redis.publisher.error", error));
    this.subClient.on("error", (error) => this.logRedisError("socket.redis.subscriber.error", error));
    this.pubClient.on("reconnecting", () => this.logger.warn(JSON.stringify({ message: "socket.redis.publisher.reconnecting" })));
    this.subClient.on("reconnecting", () => this.logger.warn(JSON.stringify({ message: "socket.redis.subscriber.reconnecting" })));

    await Promise.all([this.pubClient.connect(), this.subClient.connect()]);
    this.adapterConstructor = createAdapter(this.pubClient, this.subClient, {
      key: "fleetnexus:socket.io",
      publishOnSpecificResponseChannel: true,
    });

    this.logger.log(JSON.stringify({ message: "socket.redis.adapter.connected" }));
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, {
      ...options,
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60_000,
        skipMiddlewares: false,
      },
      pingInterval: 25_000,
      pingTimeout: 20_000,
    });

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }

    return server;
  }

  async close() {
    await Promise.allSettled([this.pubClient?.quit(), this.subClient?.quit()]);
  }

  private logRedisError(message: string, error: unknown) {
    this.logger.error(
      JSON.stringify({
        message,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}
