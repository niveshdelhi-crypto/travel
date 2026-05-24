import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

const CONNECT_MAX_ATTEMPTS =
  process.env.NODE_ENV === "production"
    ? 20
    : Number.parseInt(process.env.PRISMA_CONNECT_MAX_ATTEMPTS ?? "6", 10) || 6;
const CONNECT_RETRY_DELAY_MS =
  process.env.NODE_ENV === "production"
    ? 3_000
    : Number.parseInt(process.env.PRISMA_CONNECT_RETRY_MS ?? "1000", 10) || 1_000;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private connected = false;

  async onModuleInit() {
    if (process.env.NODE_ENV === "production") {
      await this.connectWithRetry();
      return;
    }

    // Dev: bind HTTP port immediately; Neon cold starts connect in the background.
    void this.connectWithRetry().catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Background database connect failed: ${message}`);
    });
  }

  isDatabaseReady(): boolean {
    return this.connected;
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async connectWithRetry() {
    let lastError: unknown;

    for (let attempt = 1; attempt <= CONNECT_MAX_ATTEMPTS; attempt++) {
      try {
        await this.$connect();
        this.connected = true;
        if (attempt > 1) {
          this.logger.log(`Database connected on attempt ${attempt}/${CONNECT_MAX_ATTEMPTS}`);
        }
        return;
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Database connection attempt ${attempt}/${CONNECT_MAX_ATTEMPTS} failed: ${message}`,
        );

        if (attempt < CONNECT_MAX_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, CONNECT_RETRY_DELAY_MS));
        }
      }
    }

    const hint =
      "Verify DATABASE_URL in apps/api/.env (Neon: use pooler host, sslmode=require, no channel_binding). " +
      "Wake a suspended Neon project in the Neon console, or use local Postgres from .env.example.";

    this.logger.error(hint);
    throw lastError;
  }
}
