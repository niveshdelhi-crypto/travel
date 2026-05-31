import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { WebhookProvider } from "@prisma/client";
import { WebhookRequestLogService } from "../vonage/webhook-request-log.service";
import { TelnyxReplayCacheService } from "./telnyx-replay-cache.service";
import { TelnyxSignatureService } from "./telnyx-signature.service";
import type { TelnyxWebhookRequest } from "./types/telnyx-webhook-request.types";

@Injectable()
export class TelnyxWebhookGuard implements CanActivate {
  private readonly logger = new Logger(TelnyxWebhookGuard.name);

  constructor(
    private readonly signatureService: TelnyxSignatureService,
    private readonly replayCache: TelnyxReplayCacheService,
    private readonly webhookLog: WebhookRequestLogService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TelnyxWebhookRequest>();
    const endpoint = request.originalUrl || request.url;
    const ipAddress = this.resolveClientIp(request);

    request.telnyxWebhook = { signatureValid: false, endpoint, ipAddress };

    if (!this.signatureService.isSignatureRequired()) {
      request.telnyxWebhook.signatureValid = null;
      return true;
    }

    const verification = this.signatureService.verify({
      signatureHeader: this.headerString(request.headers["telnyx-signature-ed25519"]),
      timestampHeader: this.headerString(request.headers["telnyx-timestamp"]),
      rawBody: request.rawBody,
    });

    if (!verification.valid) {
      await this.reject(request, {
        statusCode: 401,
        reason: verification.reason,
        signatureValid: false,
      });
      return false;
    }

    if (verification.replayKey) {
      const replayKey = this.replayCache.buildReplayKey(verification.replayKey, endpoint);
      const claimed = await this.replayCache.claim(replayKey);
      if (!claimed) {
        await this.reject(request, {
          statusCode: 401,
          reason: "Replay attack detected",
          signatureValid: true,
        });
        return false;
      }
      request.telnyxWebhook.replayKey = replayKey;
    }

    request.telnyxWebhook.signatureValid = true;
    return true;
  }

  private async reject(
    request: TelnyxWebhookRequest,
    options: { statusCode: number; reason: string; signatureValid: boolean },
  ): Promise<never> {
    await this.webhookLog.log({
      provider: WebhookProvider.TELNYX,
      endpoint: request.telnyxWebhook?.endpoint ?? request.originalUrl,
      headers: request.headers as Record<string, unknown>,
      payload: request.body,
      signatureValid: options.signatureValid,
      ipAddress: request.telnyxWebhook?.ipAddress,
      responseCode: options.statusCode,
    });

    this.logger.warn(
      JSON.stringify({
        message: "telnyx.webhook.rejected",
        reason: options.reason,
        endpoint: request.originalUrl,
        requestId: request.requestId,
      }),
    );

    throw new UnauthorizedException(options.reason);
  }

  private headerString(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) return value[0];
    return value;
  }

  private resolveClientIp(request: TelnyxWebhookRequest): string | undefined {
    const forwarded = request.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
      return forwarded.split(",")[0]?.trim();
    }
    return request.ip || request.socket?.remoteAddress;
  }
}
