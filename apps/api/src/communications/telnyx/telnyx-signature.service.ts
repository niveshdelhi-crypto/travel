import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createPublicKey, verify as verifyEd25519 } from "crypto";
import { TELNYX_CONFIG_KEYS } from "./telnyx.config";

export type TelnyxSignatureVerification = {
  valid: boolean;
  reason: string;
  replayKey?: string;
};

@Injectable()
export class TelnyxSignatureService {
  private readonly logger = new Logger(TelnyxSignatureService.name);

  constructor(private readonly config: ConfigService) {}

  isSignatureRequired(): boolean {
    const explicit = this.config.get<string>(TELNYX_CONFIG_KEYS.WEBHOOK_SIGNATURE_REQUIRED)?.trim();
    if (explicit === "true") return true;
    if (explicit === "false") return false;
    return this.config.get<string>("NODE_ENV") === "production";
  }

  verify(options: {
    signatureHeader: string | undefined;
    timestampHeader: string | undefined;
    rawBody: Buffer | undefined;
  }): TelnyxSignatureVerification {
    const publicKeyPem = this.config.get<string>(TELNYX_CONFIG_KEYS.PUBLIC_KEY)?.trim();
    if (!publicKeyPem) {
      return { valid: false, reason: "TELNYX_PUBLIC_KEY is not configured" };
    }

    const signature = options.signatureHeader?.trim();
    const timestamp = options.timestampHeader?.trim();
    const rawBody = options.rawBody;

    if (!signature || !timestamp) {
      return { valid: false, reason: "Missing Telnyx signature or timestamp header" };
    }
    if (!rawBody?.length) {
      return { valid: false, reason: "Missing raw request body for Telnyx verification" };
    }

    const toleranceSec = Number.parseInt(
      this.config.get<string>(TELNYX_CONFIG_KEYS.WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS) ?? "300",
      10,
    );
    const eventTime = Number.parseInt(timestamp, 10);
    if (!Number.isFinite(eventTime)) {
      return { valid: false, reason: "Invalid Telnyx timestamp header" };
    }
    const skewMs = Math.abs(Date.now() / 1000 - eventTime) * 1000;
    if (skewMs > toleranceSec * 1000) {
      return { valid: false, reason: "Telnyx webhook timestamp outside tolerance window" };
    }

    try {
      const signedPayload = `${timestamp}|${rawBody.toString("utf8")}`;
      const signatureBytes = Buffer.from(signature, "base64");
      const key = createPublicKey(publicKeyPem.includes("BEGIN PUBLIC KEY")
        ? publicKeyPem
        : `-----BEGIN PUBLIC KEY-----\n${publicKeyPem}\n-----END PUBLIC KEY-----`);

      const valid = verifyEd25519(null, Buffer.from(signedPayload), key, signatureBytes);
      if (!valid) {
        return { valid: false, reason: "Telnyx Ed25519 signature mismatch" };
      }

      return {
        valid: true,
        reason: "ok",
        replayKey: `${timestamp}:${signature.slice(0, 32)}`,
      };
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          message: "telnyx.signature.verify_failed",
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      return { valid: false, reason: "Telnyx signature verification error" };
    }
  }
}
