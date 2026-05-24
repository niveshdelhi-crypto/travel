import { Injectable, Logger } from "@nestjs/common";
import { Prisma, WebhookProvider } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export type WebhookRequestLogInput = {
  provider?: WebhookProvider;
  endpoint: string;
  headers: Record<string, unknown>;
  payload?: unknown;
  signatureValid: boolean | null;
  ipAddress?: string;
  responseCode: number;
};

@Injectable()
export class WebhookRequestLogService {
  private readonly logger = new Logger(WebhookRequestLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: WebhookRequestLogInput): Promise<void> {
    try {
      await this.prisma.webhookRequestLog.create({
        data: {
          provider: input.provider ?? WebhookProvider.VONAGE,
          endpoint: input.endpoint,
          headers: this.sanitizeHeaders(input.headers) as Prisma.InputJsonValue,
          payload: input.payload as Prisma.InputJsonValue | undefined,
          signature_valid: input.signatureValid,
          ip_address: input.ipAddress,
          response_code: input.responseCode,
        },
      });
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          message: "webhook.request_log.persist_failed",
          endpoint: input.endpoint,
          responseCode: input.responseCode,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }

  private sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(headers)) {
      const lower = key.toLowerCase();
      if (lower === "authorization" || lower.includes("signature") || lower === "cookie") {
        sanitized[key] = "[redacted]";
        continue;
      }
      sanitized[key] = value;
    }
    return sanitized;
  }
}
