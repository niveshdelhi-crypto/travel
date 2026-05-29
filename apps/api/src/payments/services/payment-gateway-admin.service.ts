import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogAction, PaymentGatewayType, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CredentialsCryptoService } from "../crypto/credentials-crypto.service";
import type { CreatePaymentGatewayDto } from "../dto/create-payment-gateway.dto";
import type { UpdatePaymentGatewayDto } from "../dto/update-payment-gateway.dto";
import { AuditLogService } from "./audit-log.service";

const gatewayListSelect = {
  id: true,
  name: true,
  type: true,
  is_active: true,
  settings: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.PaymentGatewaySelect;

@Injectable()
export class PaymentGatewayAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CredentialsCryptoService,
    private readonly auditLog: AuditLogService,
  ) {}

  async listGateways() {
    return this.prisma.paymentGateway.findMany({
      select: gatewayListSelect,
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
  }

  async getGateway(gatewayId: string) {
    const gateway = await this.prisma.paymentGateway.findUnique({
      where: { id: gatewayId },
      select: gatewayListSelect,
    });

    if (!gateway) throw new NotFoundException("Payment gateway not found");
    return gateway;
  }

  async createGateway(userId: string, dto: CreatePaymentGatewayDto) {
    const encryptedCredentials = this.crypto.encrypt(dto.credentials);

    const gateway = await this.prisma.paymentGateway.create({
      data: {
        name: dto.name.trim(),
        type: dto.type,
        is_active: dto.is_active ?? true,
        encrypted_credentials: encryptedCredentials,
        settings: dto.settings as Prisma.InputJsonValue,
      },
      select: gatewayListSelect,
    });

    await this.auditLog.log({
      action: AuditLogAction.PAYMENT_GATEWAY_CREATED,
      resourceType: "payment_gateway",
      resourceId: gateway.id,
      userId,
      metadata: { type: dto.type, name: dto.name },
    });

    return gateway;
  }

  async updateGateway(userId: string, gatewayId: string, dto: UpdatePaymentGatewayDto) {
    const existing = await this.prisma.paymentGateway.findUnique({ where: { id: gatewayId } });
    if (!existing) throw new NotFoundException("Payment gateway not found");

    const gateway = await this.prisma.paymentGateway.update({
      where: { id: gatewayId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.is_active !== undefined ? { is_active: dto.is_active } : {}),
        ...(dto.settings !== undefined ? { settings: dto.settings as Prisma.InputJsonValue } : {}),
        ...(dto.credentials !== undefined
          ? { encrypted_credentials: this.crypto.encrypt(dto.credentials) }
          : {}),
      },
      select: gatewayListSelect,
    });

    await this.auditLog.log({
      action: dto.is_active === false
        ? AuditLogAction.PAYMENT_GATEWAY_DEACTIVATED
        : AuditLogAction.PAYMENT_GATEWAY_UPDATED,
      resourceType: "payment_gateway",
      resourceId: gateway.id,
      userId,
    });

    return gateway;
  }

  getSupportedGatewayTypes(): PaymentGatewayType[] {
    return Object.values(PaymentGatewayType);
  }
}
