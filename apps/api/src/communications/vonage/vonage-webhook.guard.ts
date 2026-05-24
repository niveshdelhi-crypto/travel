import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import type { VonageWebhookRequest } from "./types/vonage-webhook-request.types";
import { VonageReplayCacheService } from "./vonage-replay-cache.service";
import { VonageSignatureService } from "./vonage-signature.service";
import { WebhookRequestLogService } from "./webhook-request-log.service";

@Injectable()
export class VonageWebhookGuard implements CanActivate {
  private readonly logger = new Logger(VonageWebhookGuard.name);

  constructor(
    private readonly signatureService: VonageSignatureService,
    private readonly replayCache: VonageReplayCacheService,
    private readonly webhookLog: WebhookRequestLogService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<VonageWebhookRequest>();
    const endpoint = request.originalUrl || request.url;
    const ipAddress = this.resolveClientIp(request);

    request.vonageWebhook = {
      signatureValid: false,
      endpoint,
      ipAddress,
    };

    if (!this.signatureService.isSignatureRequired()) {
      request.vonageWebhook.signatureValid = null;
      return true;
    }

    const token = this.signatureService.extractSignatureToken(request.headers);
    if (!token) {
      await this.reject(request, {
        statusCode: 401,
        reason: "Missing Vonage webhook signature",
        signatureValid: false,
      });
    }

    const verification = this.signatureService.verify({
      token: token!,
      rawBody: request.rawBody,
      parsedBody: request.body,
      headers: request.headers,
    });

    if (!verification.valid) {
      this.signatureService.logVerificationFailure(verification.reason, {
        endpoint,
        ipAddress,
        requestId: request.requestId,
      });
      await this.reject(request, {
        statusCode: 401,
        reason: verification.reason,
        signatureValid: false,
      });
      return false;
    }

    const replayKey = this.replayCache.buildReplayKey(
      verification.replayKey,
      verification.payloadHash,
      endpoint,
    );
    const claimed = await this.replayCache.claim(replayKey);
    if (!claimed) {
      await this.reject(request, {
        statusCode: 401,
        reason: "Replay attack detected",
        signatureValid: true,
      });
      return false;
    }

    request.vonageWebhook = {
      signatureValid: true,
      endpoint,
      ipAddress,
      replayKey,
      jwtSubject: verification.jwtId,
    };

    return true;
  }

  private async reject(
    request: VonageWebhookRequest,
    options: { statusCode: number; reason: string; signatureValid: boolean },
  ): Promise<never> {
    await this.webhookLog.log({
      endpoint: request.vonageWebhook?.endpoint ?? request.originalUrl,
      headers: request.headers as Record<string, unknown>,
      payload: request.body,
      signatureValid: options.signatureValid,
      ipAddress: request.vonageWebhook?.ipAddress,
      responseCode: options.statusCode,
    });

    this.logger.warn(
      JSON.stringify({
        message: "vonage.webhook.rejected",
        reason: options.reason,
        endpoint: request.originalUrl,
        ipAddress: request.vonageWebhook?.ipAddress,
        requestId: request.requestId,
      }),
    );

    if (options.statusCode === 403) {
      throw new ForbiddenException(options.reason);
    }
    throw new UnauthorizedException(options.reason);
  }

  private resolveClientIp(request: VonageWebhookRequest): string | undefined {
    const forwarded = request.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
      return forwarded.split(",")[0]?.trim();
    }
    return request.ip || request.socket?.remoteAddress;
  }
}
