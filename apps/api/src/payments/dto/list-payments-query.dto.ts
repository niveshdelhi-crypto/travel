import { IsEnum, IsOptional } from "class-validator";
import { AuditLogAction, PaymentStatus } from "@prisma/client";

export class ListTransactionsQueryDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;
}

export class ListAuditLogsQueryDto {
  @IsOptional()
  @IsEnum(AuditLogAction)
  action?: AuditLogAction;

  @IsOptional()
  resource_type?: string;
}
