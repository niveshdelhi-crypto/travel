import {
  ForbiddenException,
  Injectable,
  Logger,
  NestMiddleware,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { NextFunction, Response } from "express";
import { VONAGE_WEBHOOK_ENV_KEYS } from "../vonage-webhook.constants";
import type { VonageWebhookRequest } from "../types/vonage-webhook-request.types";

@Injectable()
export class VonageWebhookIpMiddleware implements NestMiddleware {
  private readonly logger = new Logger(VonageWebhookIpMiddleware.name);
  private readonly allowlist: string[];

  constructor(private readonly config: ConfigService) {
    const raw = this.config.get<string>(VONAGE_WEBHOOK_ENV_KEYS.IP_ALLOWLIST)?.trim();
    this.allowlist =
      raw
        ?.split(",")
        .map((entry) => entry.trim())
        .filter(Boolean) ?? [];
  }

  use(request: VonageWebhookRequest, _response: Response, next: NextFunction) {
    if (this.allowlist.length === 0) {
      next();
      return;
    }

    const clientIp = this.resolveClientIp(request);
    if (!clientIp || !this.isAllowed(clientIp)) {
      this.logger.warn(
        JSON.stringify({
          message: "vonage.webhook.ip.rejected",
          clientIp,
          endpoint: request.originalUrl,
        }),
      );
      next(new ForbiddenException("Webhook source IP is not allowlisted"));
      return;
    }

    next();
  }

  private isAllowed(clientIp: string): boolean {
    return this.allowlist.some((entry) => entry === clientIp || entry === "*");
  }

  private resolveClientIp(request: VonageWebhookRequest): string | undefined {
    const forwarded = request.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
      return forwarded.split(",")[0]?.trim();
    }
    return request.ip || request.socket?.remoteAddress;
  }
}
