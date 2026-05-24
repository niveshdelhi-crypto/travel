import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, mergeMap } from "rxjs";
import type { VonageWebhookRequest } from "../types/vonage-webhook-request.types";
import { WebhookRequestLogService } from "../webhook-request-log.service";

@Injectable()
export class VonageWebhookAuditInterceptor implements NestInterceptor {
  constructor(private readonly webhookLog: WebhookRequestLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<VonageWebhookRequest>();
    const response = context.switchToHttp().getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      mergeMap(async (body) => {
        await this.persist(request, response.statusCode);
        return body;
      }),
    );
  }

  private async persist(request: VonageWebhookRequest, responseCode: number) {
    const signatureValid =
      request.vonageWebhook?.signatureValid === undefined
        ? null
        : request.vonageWebhook.signatureValid;

    await this.webhookLog.log({
      endpoint: request.vonageWebhook?.endpoint ?? request.originalUrl,
      headers: request.headers as Record<string, unknown>,
      payload: request.body,
      signatureValid,
      ipAddress: request.vonageWebhook?.ipAddress,
      responseCode,
    });
  }
}
