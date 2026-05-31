import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { WebhookProvider } from "@prisma/client";
import { Observable, tap } from "rxjs";
import { WebhookRequestLogService } from "../../vonage/webhook-request-log.service";
import type { TelnyxWebhookRequest } from "../types/telnyx-webhook-request.types";

@Injectable()
export class TelnyxWebhookAuditInterceptor implements NestInterceptor {
  constructor(private readonly webhookLog: WebhookRequestLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<TelnyxWebhookRequest>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          void this.webhookLog.log({
            provider: WebhookProvider.TELNYX,
            endpoint: request.telnyxWebhook?.endpoint ?? request.originalUrl,
            headers: request.headers as Record<string, unknown>,
            payload: request.body,
            signatureValid: request.telnyxWebhook?.signatureValid ?? null,
            ipAddress: request.telnyxWebhook?.ipAddress,
            responseCode: 200,
          });
        },
        error: () => {
          void this.webhookLog.log({
            provider: WebhookProvider.TELNYX,
            endpoint: request.telnyxWebhook?.endpoint ?? request.originalUrl,
            headers: request.headers as Record<string, unknown>,
            payload: request.body,
            signatureValid: request.telnyxWebhook?.signatureValid ?? null,
            ipAddress: request.telnyxWebhook?.ipAddress,
            responseCode: 500,
          });
        },
        finalize: () => {
          void startedAt;
        },
      }),
    );
  }
}
