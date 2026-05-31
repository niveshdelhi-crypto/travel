import { ForbiddenException, Injectable, NestMiddleware } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { NextFunction, Response } from "express";
import { TELNYX_CONFIG_KEYS } from "../telnyx.config";
import type { TelnyxWebhookRequest } from "../types/telnyx-webhook-request.types";

@Injectable()
export class TelnyxWebhookIpMiddleware implements NestMiddleware {
  constructor(private readonly config: ConfigService) {}

  use(request: TelnyxWebhookRequest, _response: Response, next: NextFunction) {
    const allowlist = this.config
      .get<string>(TELNYX_CONFIG_KEYS.WEBHOOK_IP_ALLOWLIST)
      ?.split(",")
      .map((ip) => ip.trim())
      .filter(Boolean);

    if (!allowlist?.length) {
      next();
      return;
    }

    const forwarded = request.headers["x-forwarded-for"];
    const clientIp =
      (typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : undefined) ||
      request.ip ||
      request.socket?.remoteAddress;

    if (!clientIp || !allowlist.includes(clientIp)) {
      throw new ForbiddenException("Telnyx webhook source IP not allowed");
    }

    next();
  }
}
