import { Injectable } from "@nestjs/common";
import { AuditLogAction, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export type AuditLogInput = {
  action: AuditLogAction;
  resourceType: string;
  resourceId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput) {
    return this.prisma.auditLog.create({
      data: {
        action: input.action,
        resource_type: input.resourceType,
        resource_id: input.resourceId ?? null,
        user_id: input.userId ?? null,
        ip_address: input.ipAddress ?? null,
        user_agent: input.userAgent ?? null,
        request_method: input.requestMethod ?? null,
        request_path: input.requestPath ?? null,
        metadata: input.metadata ?? undefined,
      },
    });
  }

  async list(page = 1, pageSize = 25, filters?: { action?: AuditLogAction; resourceType?: string }) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(100, Math.max(10, pageSize));
    const skip = (safePage - 1) * safePageSize;

    const where: Prisma.AuditLogWhereInput = {};
    if (filters?.action) where.action = filters.action;
    if (filters?.resourceType) where.resource_type = filters.resourceType;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: safePageSize,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    };
  }
}
