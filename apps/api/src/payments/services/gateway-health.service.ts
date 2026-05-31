import { Injectable, Logger } from "@nestjs/common";
import {
  AuditLogAction,
  PaymentAttemptStatus,
  PaymentGatewayType,
  PaymentStatus,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { PaypalPaymentProvider } from "../providers/paypal.provider";
import type {
  GatewayOperationalStatus,
  PaymentGatewayHealthRow,
} from "../providers/paypal-health.types";
import { GatewayRegistryService } from "./gateway-registry.service";
import { AuditLogService } from "./audit-log.service";

@Injectable()
export class GatewayHealthService {
  private readonly logger = new Logger(GatewayHealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: GatewayRegistryService,
    private readonly paypal: PaypalPaymentProvider,
    private readonly auditLog: AuditLogService,
  ) {}

  async getGatewayHealth(): Promise<{ data: PaymentGatewayHealthRow[]; checked_at: string }> {
    const checkedAt = new Date().toISOString();
    const gateways = await this.prisma.paymentGateway.findMany({
      orderBy: { name: "asc" },
    });

    const [lastSuccessMap, lastFailedMap] = await Promise.all([
      this.loadLastCharges(PaymentStatus.SUCCESS),
      this.loadLastCharges(PaymentStatus.FAILED),
    ]);

    const rows = await Promise.all(
      gateways.map(async (gateway) => {
        const lastSuccessful = lastSuccessMap.get(gateway.id) ?? null;
        const lastFailed = lastFailedMap.get(gateway.id) ?? null;

        if (!gateway.is_active) {
          return this.inactiveRow(gateway, lastSuccessful, lastFailed, checkedAt);
        }

        try {
          const resolved = await this.registry.resolveGateway(gateway.id);

          if (resolved.type === PaymentGatewayType.paypal) {
            return this.probePaypalGateway(
              gateway.id,
              gateway.name,
              resolved.credentials,
              resolved.settings,
              lastSuccessful,
              lastFailed,
              checkedAt,
            );
          }

          return this.unsupportedProviderRow(
            gateway.id,
            gateway.name,
            resolved.type,
            lastSuccessful,
            lastFailed,
            checkedAt,
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Health check failed";
          this.logger.warn(
            JSON.stringify({ message: "gateway.health.failed", gatewayId: gateway.id, error: message }),
          );
          return this.failedRow(
            gateway.id,
            gateway.name,
            gateway.type,
            null,
            lastSuccessful,
            lastFailed,
            checkedAt,
            message,
          );
        }
      }),
    );

    return { data: rows, checked_at: checkedAt };
  }

  private async probePaypalGateway(
    gatewayId: string,
    gatewayName: string,
    credentials: Record<string, string>,
    settings: Record<string, unknown> | null,
    lastSuccessful: string | null,
    lastFailed: string | null,
    checkedAt: string,
  ): Promise<PaymentGatewayHealthRow> {
    const diagnostics = await this.paypal.runHealthDiagnostics(credentials, settings);

    await this.auditLog.log({
      action: AuditLogAction.GATEWAY_HEALTH_CHECK,
      resourceType: "payment_gateway",
      resourceId: gatewayId,
      metadata: {
        provider: "paypal",
        environment: diagnostics.environment,
        oauth_valid: diagnostics.oauth_valid,
        orders_api: diagnostics.orders_api,
        capture_api: diagnostics.capture_api,
        card_processing_eligible: diagnostics.card_processing_eligible,
        currency_supported: diagnostics.currency_supported,
        currency_tested: diagnostics.currency_tested,
      },
    });

    const status = this.derivePaypalStatus(diagnostics);
    const detail = this.buildPaypalDetail(diagnostics);

    return {
      gateway_id: gatewayId,
      gateway_name: gatewayName,
      gateway_type: PaymentGatewayType.paypal,
      status,
      environment: diagnostics.environment,
      oauth_valid: diagnostics.oauth_valid,
      orders_api: diagnostics.orders_api,
      capture_api: diagnostics.capture_api,
      card_processing_eligible: diagnostics.card_processing_eligible,
      currency_supported: diagnostics.currency_supported,
      currency_tested: diagnostics.currency_tested,
      last_successful_charge: lastSuccessful,
      last_failed_charge: lastFailed,
      is_active: true,
      checked_at: checkedAt,
      detail,
    };
  }

  private derivePaypalStatus(
    d: Awaited<ReturnType<PaypalPaymentProvider["runHealthDiagnostics"]>>,
  ): GatewayOperationalStatus {
    if (!d.oauth_valid) return "FAILED";

    const coreApis = d.orders_api && d.capture_api && d.currency_supported;
    const cardReady = d.card_processing_eligible;

    if (coreApis && cardReady) return "CONNECTED";
    if (d.oauth_valid && (d.orders_api || d.capture_api)) return "DEGRADED";
    return "FAILED";
  }

  private buildPaypalDetail(
    d: Awaited<ReturnType<PaypalPaymentProvider["runHealthDiagnostics"]>>,
  ): string | undefined {
    const parts: string[] = [];
    if (d.oauth_message) parts.push(d.oauth_message);
    if (d.orders_api_message && !d.orders_api) parts.push(d.orders_api_message);
    if (d.capture_api_message && !d.capture_api) parts.push(d.capture_api_message);
    if (d.card_processing_message && !d.card_processing_eligible) {
      parts.push(d.card_processing_message);
    }
    if (d.currency_message && !d.currency_supported) parts.push(d.currency_message);
    return parts.length > 0 ? parts.join(" · ") : undefined;
  }

  private async loadLastCharges(status: PaymentStatus): Promise<Map<string, string>> {
    const map = new Map<string, string>();

    const txnGroups = await this.prisma.paymentTransaction.groupBy({
      by: ["gateway_id"],
      where: { status, type: "CHARGE" },
      _max: { processed_at: true, created_at: true },
    });

    for (const row of txnGroups) {
      const at = row._max.processed_at ?? row._max.created_at;
      if (at) map.set(row.gateway_id, at.toISOString());
    }

    const attemptStatus =
      status === PaymentStatus.SUCCESS
        ? PaymentAttemptStatus.CAPTURED
        : PaymentAttemptStatus.FAILED;

    const attemptGroups = await this.prisma.paymentSessionAttempt.groupBy({
      by: ["gateway_id"],
      where: { status: attemptStatus },
      _max: { updated_at: true, created_at: true },
    });

    for (const row of attemptGroups) {
      const at = row._max.updated_at ?? row._max.created_at;
      if (!at) continue;
      const iso = at.toISOString();
      const existing = map.get(row.gateway_id);
      if (!existing || new Date(iso) > new Date(existing)) {
        map.set(row.gateway_id, iso);
      }
    }

    return map;
  }

  private inactiveRow(
    gateway: { id: string; name: string; type: PaymentGatewayType },
    lastSuccessful: string | null,
    lastFailed: string | null,
    checkedAt: string,
  ): PaymentGatewayHealthRow {
    return {
      gateway_id: gateway.id,
      gateway_name: gateway.name,
      gateway_type: gateway.type,
      status: "FAILED",
      environment: null,
      oauth_valid: false,
      orders_api: false,
      capture_api: false,
      card_processing_eligible: null,
      currency_supported: null,
      currency_tested: null,
      last_successful_charge: lastSuccessful,
      last_failed_charge: lastFailed,
      is_active: false,
      checked_at: checkedAt,
      detail: "Gateway disabled in admin",
    };
  }

  private unsupportedProviderRow(
    gatewayId: string,
    gatewayName: string,
    gatewayType: PaymentGatewayType,
    lastSuccessful: string | null,
    lastFailed: string | null,
    checkedAt: string,
  ): PaymentGatewayHealthRow {
    return {
      gateway_id: gatewayId,
      gateway_name: gatewayName,
      gateway_type: gatewayType,
      status: "DEGRADED",
      environment: null,
      oauth_valid: false,
      orders_api: false,
      capture_api: false,
      card_processing_eligible: null,
      currency_supported: null,
      currency_tested: null,
      last_successful_charge: lastSuccessful,
      last_failed_charge: lastFailed,
      is_active: true,
      checked_at: checkedAt,
      detail: `Live API health probes are implemented for PayPal only (${gatewayType} pending)`,
    };
  }

  private failedRow(
    gatewayId: string,
    gatewayName: string,
    gatewayType: PaymentGatewayType,
    environment: string | null,
    lastSuccessful: string | null,
    lastFailed: string | null,
    checkedAt: string,
    detail: string,
  ): PaymentGatewayHealthRow {
    return {
      gateway_id: gatewayId,
      gateway_name: gatewayName,
      gateway_type: gatewayType,
      status: "FAILED",
      environment,
      oauth_valid: false,
      orders_api: false,
      capture_api: false,
      card_processing_eligible: null,
      currency_supported: null,
      currency_tested: null,
      last_successful_charge: lastSuccessful,
      last_failed_charge: lastFailed,
      is_active: true,
      checked_at: checkedAt,
      detail,
    };
  }
}
