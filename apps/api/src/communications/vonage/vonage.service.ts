import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { readFileSync } from "fs";
import { Vonage } from "@vonage/server-sdk";
import { PUBLIC_API_BASE_URL_KEY, VONAGE_ENV_KEYS } from "./vonage.config";
import { VonageApiError, VonageConfigurationError } from "./vonage.errors";
import type {
  VonageCreateOutboundCallParams,
  VonageCreateOutboundCallResult,
} from "./types/vonage-outbound-call.types";

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 250;

@Injectable()
export class VonageService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VonageService.name);
  private client: Vonage | null = null;
  private configured = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.initializeClient();
  }

  onModuleDestroy() {
    this.client = null;
    this.configured = false;
  }

  isConfigured(): boolean {
    return this.configured;
  }

  getPublicApiBaseUrl(): string {
    const base = this.config.get<string>(PUBLIC_API_BASE_URL_KEY)?.trim();
    if (!base) {
      throw new VonageConfigurationError(
        `${PUBLIC_API_BASE_URL_KEY} is required for Vonage webhook URLs`,
      );
    }
    return base.replace(/\/$/, "");
  }

  buildWebhookUrl(path: string): string {
    return `${this.getPublicApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  }

  getDefaultFromNumber(): string {
    const from = this.config.get<string>(VONAGE_ENV_KEYS.DEFAULT_FROM_NUMBER)?.trim();
    if (!from) {
      throw new VonageConfigurationError(
        `${VONAGE_ENV_KEYS.DEFAULT_FROM_NUMBER} is required for outbound calls`,
      );
    }
    return from;
  }

  async createOutboundCall(
    params: Omit<VonageCreateOutboundCallParams, "answerUrl" | "eventUrl"> & {
      answerUrl?: string[];
      eventUrl?: string[];
    },
  ): Promise<VonageCreateOutboundCallResult> {
    const answerUrl = params.answerUrl ?? [
      this.buildWebhookUrl("/api/calls/webhooks/answer"),
    ];
    const eventUrl = params.eventUrl ?? [
      this.buildWebhookUrl("/api/calls/webhooks/events"),
    ];

    const payload = {
      to: params.to,
      from: params.from,
      answerUrl,
      eventUrl,
    };

    return this.executeWithRetry("voice.createOutboundCall", async () => {
      const vonage = this.getClient();
      const response = await vonage.voice.createOutboundCall(payload);
      const uuid = response?.uuid;
      if (!uuid) {
        throw new VonageApiError("Vonage did not return a call UUID", { retryable: false });
      }
      return {
        uuid,
        status: response.status,
        direction: response.direction,
        conversationUuid: response.conversationUUID,
      };
    });
  }

  async getCall(providerCallId: string) {
    return this.executeWithRetry("voice.getCall", async () => {
      const vonage = this.getClient();
      return vonage.voice.getCall(providerCallId);
    });
  }

  private initializeClient() {
    try {
      const credentials = this.readCredentials();
      const baseUrl = this.config.get<string>(VONAGE_ENV_KEYS.BASE_URL)?.trim();
      this.client = new Vonage(credentials, baseUrl ? { apiHost: baseUrl } : undefined);
      this.configured = true;
      this.logger.log(
        JSON.stringify({
          message: "vonage.client.initialized",
          applicationId: credentials.applicationId,
          hasCustomBaseUrl: Boolean(baseUrl),
        }),
      );
    } catch (error) {
      this.configured = false;
      this.client = null;
      this.logger.warn(
        JSON.stringify({
          message: "vonage.client.not_configured",
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }

  private readCredentials() {
    const apiKey = this.requireEnv(VONAGE_ENV_KEYS.API_KEY);
    const apiSecret = this.requireEnv(VONAGE_ENV_KEYS.API_SECRET);
    const applicationId = this.requireEnv(VONAGE_ENV_KEYS.APPLICATION_ID);
    const privateKeyPath = this.requireEnv(VONAGE_ENV_KEYS.PRIVATE_KEY_PATH);

    let privateKey: string;
    try {
      privateKey = readFileSync(privateKeyPath, "utf8");
    } catch (error) {
      throw new VonageConfigurationError(
        `Unable to read Vonage private key at ${privateKeyPath}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return { apiKey, apiSecret, applicationId, privateKey };
  }

  private getClient(): Vonage {
    if (!this.client || !this.configured) {
      throw new VonageConfigurationError(
        "Vonage is not configured. Set VONAGE_* environment variables and restart the API.",
      );
    }
    return this.client;
  }

  private requireEnv(key: string): string {
    const value = this.config.get<string>(key)?.trim();
    if (!value) {
      throw new VonageConfigurationError(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  private async executeWithRetry<T>(
    operation: string,
    fn: () => Promise<T>,
    attempt = 1,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const normalized = this.normalizeError(error);
      const shouldRetry = normalized.retryable && attempt < MAX_RETRY_ATTEMPTS;

      this.logger.warn(
        JSON.stringify({
          message: "vonage.api.error",
          operation,
          attempt,
          retryable: normalized.retryable,
          statusCode: normalized.statusCode,
          providerCode: normalized.providerCode,
          error: normalized.message,
        }),
      );

      if (!shouldRetry) {
        throw normalized;
      }

      const delayMs = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
      await this.sleep(delayMs);
      return this.executeWithRetry(operation, fn, attempt + 1);
    }
  }

  private normalizeError(error: unknown): VonageApiError {
    if (error instanceof VonageConfigurationError) {
      return new VonageApiError(error.message, { retryable: false });
    }
    if (error instanceof VonageApiError) {
      return error;
    }

    const err = error as {
      message?: string;
      statusCode?: number;
      response?: { status?: number; data?: { type?: string } };
    };
    const statusCode = err.statusCode ?? err.response?.status;
    const retryable =
      statusCode === 429 || statusCode === 500 || statusCode === 502 || statusCode === 503;

    return new VonageApiError(err.message ?? "Vonage API request failed", {
      statusCode,
      providerCode: err.response?.data?.type,
      retryable,
    });
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
