import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

const CONNECT_MAX_ATTEMPTS = 20;
const CONNECT_RETRY_DELAY_MS = 3_000;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async connectWithRetry() {
    let lastError: unknown;

    for (let attempt = 1; attempt <= CONNECT_MAX_ATTEMPTS; attempt++) {
      try {
        await this.$connect();
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
