import { Injectable, NestMiddleware } from "@nestjs/common";
import { AuditLogAction } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user";
import { AuditLogService } from "../services/audit-log.service";

type PaymentAuditRequest = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class PaymentAuditMiddleware implements NestMiddleware {
  constructor(private readonly auditLog: AuditLogService) {}

  use(req: PaymentAuditRequest, res: Response, next: NextFunction) {
    res.on("finish", () => {
      void this.auditLog.log({
        action: AuditLogAction.PAYMENT_ROUTE_ACCESSED,
        resourceType: "payment_route",
        userId: req.user?.id,
        ipAddress: this.extractIp(req),
        userAgent: req.headers["user-agent"],
        requestMethod: req.method,
        requestPath: req.originalUrl,
        metadata: {
          statusCode: res.statusCode,
        },
      });
    });

    next();
  }

  private extractIp(req: PaymentAuditRequest): string | undefined {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
      return forwarded.split(",")[0]?.trim();
    }
    return req.ip;
  }
}
