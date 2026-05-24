import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, timingSafeEqual } from "crypto";
import { verify, type JwtPayload } from "jsonwebtoken";
import {
  DEFAULT_WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS,
  VONAGE_WEBHOOK_ENV_KEYS,
} from "./vonage-webhook.constants";

export type VonageSignatureVerificationInput = {
  token: string;
  rawBody?: Buffer;
  parsedBody?: unknown;
  headers: Record<string, string | string[] | undefined>;
};

export type VonageSignatureVerificationResult =
  | {
      valid: true;
      payloadHash: string;
      issuedAt: number;
      replayKey: string;
      jwtId?: string;
    }
  | {
      valid: false;
      reason: string;
    };

type VonageWebhookJwtPayload = JwtPayload & {
  payload_hash?: string;
  iat?: number;
  jti?: string;
};

@Injectable()
export class VonageSignatureService {
  private readonly logger = new Logger(VonageSignatureService.name);

  constructor(private readonly config: ConfigService) {}

  isSignatureRequired(): boolean {
    const explicit = this.config.get<string>(VONAGE_WEBHOOK_ENV_KEYS.SIGNATURE_REQUIRED)?.trim();
    if (explicit === "true") return true;
    if (explicit === "false") return false;
    return this.config.get<string>("NODE_ENV") === "production";
  }

  extractSignatureToken(headers: Record<string, string | string[] | undefined>): string | null {
    const authorization = this.headerValue(headers, "authorization");
    if (authorization) {
      const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);
      if (bearerMatch?.[1]) return bearerMatch[1].trim();
      return authorization.trim();
    }

    const vonageSignature =
      this.headerValue(headers, "vonage-signature") ??
      this.headerValue(headers, "x-vonage-signature");
    return vonageSignature?.trim() ?? null;
  }

  verify(input: VonageSignatureVerificationInput): VonageSignatureVerificationResult {
    const secret = this.resolveSignatureSecret();
    if (!secret) {
      return { valid: false, reason: "VONAGE_SIGNATURE_SECRET is not configured" };
    }

    const token = input.token?.trim();
    if (!token) {
      return { valid: false, reason: "Missing Vonage webhook signature token" };
    }

    let decoded: VonageWebhookJwtPayload;
    try {
      decoded = verify(token, secret, {
        algorithms: ["HS256"],
      }) as VonageWebhookJwtPayload;
    } catch (error) {
      return {
        valid: false,
        reason: error instanceof Error ? error.message : "JWT verification failed",
      };
    }

    const issuedAt = decoded.iat;
    if (typeof issuedAt !== "number" || !Number.isFinite(issuedAt)) {
      return { valid: false, reason: "JWT missing valid iat claim" };
    }

    const toleranceSeconds = this.timestampToleranceSeconds();
    const nowSeconds = Math.floor(Date.now() / 1000);
    const ageSeconds = nowSeconds - issuedAt;
    if (ageSeconds > toleranceSeconds) {
      return {
        valid: false,
        reason: `Webhook timestamp expired (age ${ageSeconds}s > ${toleranceSeconds}s)`,
      };
    }
    if (issuedAt - nowSeconds > 60) {
      return { valid: false, reason: "Webhook timestamp is in the future" };
    }

    const expectedPayloadHash = decoded.payload_hash;
    if (!expectedPayloadHash || typeof expectedPayloadHash !== "string") {
      return { valid: false, reason: "JWT missing payload_hash claim" };
    }

    const actualPayloadHash = this.hashPayload(input.rawBody, input.parsedBody);
    if (!this.comparePayloadHashes(expectedPayloadHash, actualPayloadHash)) {
      return { valid: false, reason: "Payload hash mismatch" };
    }

    const replayKey =
      typeof decoded.jti === "string" && decoded.jti.length > 0
        ? decoded.jti
        : createHash("sha256").update(`${token}:${actualPayloadHash}`).digest("hex");

    return {
      valid: true,
      payloadHash: actualPayloadHash,
      issuedAt,
      replayKey,
      jwtId: typeof decoded.jti === "string" ? decoded.jti : undefined,
    };
  }

  hashPayload(rawBody?: Buffer, parsedBody?: unknown): string {
    if (rawBody && rawBody.length > 0) {
      return createHash("sha256").update(rawBody).digest("hex");
    }
    if (parsedBody !== undefined) {
      return createHash("sha256").update(JSON.stringify(parsedBody)).digest("hex");
    }
    return createHash("sha256").update("").digest("hex");
  }

  private comparePayloadHashes(expected: string, actual: string): boolean {
    try {
      const expectedBuffer = Buffer.from(expected.toLowerCase(), "hex");
      const actualBuffer = Buffer.from(actual.toLowerCase(), "hex");
      if (expectedBuffer.length !== actualBuffer.length) return false;
      return timingSafeEqual(expectedBuffer, actualBuffer);
    } catch {
      const expectedUtf8 = Buffer.from(expected);
      const actualUtf8 = Buffer.from(actual);
      if (expectedUtf8.length !== actualUtf8.length) return false;
      return timingSafeEqual(expectedUtf8, actualUtf8);
    }
  }

  private resolveSignatureSecret(): string | Buffer | null {
    const raw = this.config.get<string>(VONAGE_WEBHOOK_ENV_KEYS.SIGNATURE_SECRET)?.trim();
    if (!raw) return null;

    if (/^[A-Za-z0-9+/]+=*$/.test(raw) && raw.length >= 16) {
      try {
        return Buffer.from(raw, "base64");
      } catch {
        return raw;
      }
    }

    return raw;
  }

  private timestampToleranceSeconds(): number {
    const configured = this.config.get<string>(
      VONAGE_WEBHOOK_ENV_KEYS.TIMESTAMP_TOLERANCE_SECONDS,
    );
    const parsed = Number.parseInt(configured ?? "", 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
    return DEFAULT_WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS;
  }

  private headerValue(
    headers: Record<string, string | string[] | undefined>,
    name: string,
  ): string | undefined {
    const value = headers[name] ?? headers[name.toLowerCase()];
    if (Array.isArray(value)) return value[0];
    return value;
  }

  logVerificationFailure(reason: string, context: Record<string, unknown>) {
    this.logger.warn(JSON.stringify({ message: "vonage.webhook.signature.invalid", reason, ...context }));
  }
}
