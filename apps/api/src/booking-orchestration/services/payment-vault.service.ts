import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuditLogAction } from "@prisma/client";
import { createHash, randomBytes } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { CredentialsCryptoService } from "../../payments/crypto/credentials-crypto.service";
import { AuditLogService } from "../../payments/services/audit-log.service";

const SESSION_TTL_MS = 15 * 60 * 1000;

export type StoreVaultEntryInput = {
  travelerId: string;
  tokenReference: string;
  last4: string;
  cardBrand?: string;
  expMonth?: number;
  expYear?: number;
  billingName?: string;
  /** Never include CVV — tokenized reference only */
  encryptedTokenPayload: Record<string, string>;
  actorId?: string;
};

@Injectable()
export class PaymentVaultService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CredentialsCryptoService,
    private readonly auditLog: AuditLogService,
    private readonly config: ConfigService,
  ) {}

  maskPan(last4: string): string {
    return `•••• •••• •••• ${last4.padStart(4, "•")}`;
  }

  async storeVaultEntry(input: StoreVaultEntryInput) {
    if ("cvv" in input.encryptedTokenPayload || "cvc" in input.encryptedTokenPayload) {
      throw new BadRequestException("CVV must never be stored");
    }

    const encryptedPayload = this.crypto.encrypt(input.encryptedTokenPayload);
    const maskedPan = this.maskPan(input.last4);

    const entry = await this.prisma.secureCustomerPaymentVault.create({
      data: {
        traveler_id: input.travelerId,
        token_reference: input.tokenReference,
        masked_pan: maskedPan,
        card_brand: input.cardBrand ?? null,
        exp_month: input.expMonth ?? null,
        exp_year: input.expYear ?? null,
        billing_name: input.billingName ?? null,
        encrypted_payload: encryptedPayload,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    await this.auditLog.log({
      action: AuditLogAction.VAULT_ENTRY_CREATED,
      resourceType: "secure_customer_payment_vault",
      resourceId: entry.id,
      userId: input.actorId,
      metadata: { masked_pan: maskedPan, card_brand: input.cardBrand },
    });

    return {
      id: entry.id,
      masked_pan: entry.masked_pan,
      card_brand: entry.card_brand,
      exp_month: entry.exp_month,
      exp_year: entry.exp_year,
    };
  }

  async createSecureSession(travelerId: string, vaultId?: string, ipAddress?: string) {
    const rawToken = randomBytes(32).toString("base64url");
    const sessionTokenHash = this.hashSessionToken(rawToken);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    const session = await this.prisma.securePaymentSession.create({
      data: {
        traveler_id: travelerId,
        vault_id: vaultId ?? null,
        session_token_hash: sessionTokenHash,
        expires_at: expiresAt,
        ip_address: ipAddress ?? null,
      },
    });

    await this.auditLog.log({
      action: AuditLogAction.VAULT_SESSION_CREATED,
      resourceType: "secure_payment_session",
      resourceId: session.id,
      metadata: { expires_at: expiresAt.toISOString() },
    });

    return {
      sessionId: session.id,
      sessionToken: rawToken,
      expiresAt,
    };
  }

  async listMaskedCards(travelerId: string) {
    const entries = await this.prisma.secureCustomerPaymentVault.findMany({
      where: { traveler_id: travelerId, is_active: true },
      select: {
        id: true,
        masked_pan: true,
        card_brand: true,
        exp_month: true,
        exp_year: true,
        expires_at: true,
      },
      orderBy: { created_at: "desc" },
    });

    return entries;
  }

  /** Admin-only: decrypt token payload for payment processing */
  async revealTokenForAdmin(vaultId: string, actorRole: string) {
    if (actorRole !== "admin") {
      throw new BadRequestException("Only administrators can reveal vault token data");
    }

    const entry = await this.prisma.secureCustomerPaymentVault.findUniqueOrThrow({
      where: { id: vaultId },
    });

    return {
      tokenReference: entry.token_reference,
      payload: this.crypto.decrypt<Record<string, string>>(entry.encrypted_payload),
      masked_pan: entry.masked_pan,
    };
  }

  private hashSessionToken(token: string): string {
    const pepper = this.config.get<string>("PAYMENT_VAULT_SESSION_PEPPER") ?? "fleetnexus-vault";
    return createHash("sha256").update(`${pepper}:${token}`).digest("hex");
  }
}
