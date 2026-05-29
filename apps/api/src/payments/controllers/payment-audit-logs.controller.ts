import { Controller, Get, ParseIntPipe, Query } from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { PAYMENT_ADMIN_ROLES } from "../constants/payment-roles.constants";
import { ListAuditLogsQueryDto } from "../dto/list-payments-query.dto";
import { AuditLogService } from "../services/audit-log.service";

@Controller("payments/audit-logs")
@Roles(...PAYMENT_ADMIN_ROLES)
export class PaymentAuditLogsController {
  constructor(private readonly auditLog: AuditLogService) {}

  @Get()
  list(
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("pageSize", new ParseIntPipe({ optional: true })) pageSize = 25,
    @Query() query: ListAuditLogsQueryDto = {},
  ) {
    return this.auditLog.list(page, pageSize, {
      action: query.action,
      resourceType: query.resource_type,
    });
  }
}
