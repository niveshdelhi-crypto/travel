import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

@Injectable()
export class CredentialsCryptoService {
  private readonly encryptionKey: Buffer;

  constructor(private readonly config: ConfigService) {
    const rawKey = this.config.get<string>("PAYMENT_CREDENTIALS_ENCRYPTION_KEY");
    if (!rawKey) {
      if (this.config.get<string>("NODE_ENV") === "production") {
        throw new InternalServerErrorException(
          "PAYMENT_CREDENTIALS_ENCRYPTION_KEY is required for payment gateway credential storage",
        );
      }

      this.encryptionKey = scryptSync("fleetnexus-dev-payment-key", "salt", KEY_LENGTH);
      return;
    }

    this.encryptionKey = this.resolveKey(rawKey);
  }

  encrypt(plaintext: Record<string, unknown>): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.encryptionKey, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(plaintext), "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]).toString("base64");
  }

  decrypt<T extends Record<string, unknown>>(ciphertext: string): T {
    const payload = Buffer.from(ciphertext, "base64");
    const iv = payload.subarray(0, IV_LENGTH);
    const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, this.encryptionKey, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
      "utf8",
    );

    return JSON.parse(decrypted) as T;
  }

  private resolveKey(rawKey: string): Buffer {
    if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
      return Buffer.from(rawKey, "hex");
    }

    const decoded = Buffer.from(rawKey, "base64");
    if (decoded.length === KEY_LENGTH) {
      return decoded;
    }

    return scryptSync(rawKey, "fleetnexus-payment-credentials", KEY_LENGTH);
  }
}
