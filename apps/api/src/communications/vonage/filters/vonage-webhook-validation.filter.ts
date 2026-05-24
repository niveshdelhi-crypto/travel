import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import type { VonageWebhookRequest } from "../types/vonage-webhook-request.types";
import { WebhookRequestLogService } from "../webhook-request-log.service";

@Catch(BadRequestException)
export class VonageWebhookValidationFilter implements ExceptionFilter {
  private readonly logger = new Logger(VonageWebhookValidationFilter.name);

  constructor(private readonly webhookLog: WebhookRequestLogService) {}

  async catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<VonageWebhookRequest>();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const body = exception.getResponse();

    this.logger.warn(
      JSON.stringify({
        message: "vonage.webhook.payload.invalid",
        endpoint: request.originalUrl,
        requestId: request.requestId,
        errors: body,
      }),
    );

    await this.webhookLog.log({
      endpoint: request.vonageWebhook?.endpoint ?? request.originalUrl,
      headers: request.headers as Record<string, unknown>,
      payload: request.body,
      signatureValid: request.vonageWebhook?.signatureValid ?? null,
      ipAddress: request.vonageWebhook?.ipAddress,
      responseCode: status,
    });

    response.status(status).json(body);
  }
}
