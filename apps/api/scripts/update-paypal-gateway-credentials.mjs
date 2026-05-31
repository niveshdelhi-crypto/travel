/**
 * Upserts PayPal sandbox credentials into payment_gateways (encrypted at rest).
 *
 * Reads from env (or apps/api/.env):
 *   PAYPAL_SANDBOX_CLIENT_ID
 *   PAYPAL_SANDBOX_CLIENT_SECRET
 *
 * Usage:
 *   node scripts/update-paypal-gateway-credentials.mjs
 */
import { createCipheriv, randomBytes, scryptSync } from "crypto";
import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { PaymentGatewayType, PrismaClient } from "@prisma/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env");

function loadDotEnv() {
  if (!existsSync(ENV_PATH)) return;
  for (const line of readFileSync(ENV_PATH, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key] !== undefined) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

/** Matches CredentialsCryptoService dev fallback when PAYMENT_CREDENTIALS_ENCRYPTION_KEY is unset. */
function resolveEncryptionKey() {
  const rawKey = process.env.PAYMENT_CREDENTIALS_ENCRYPTION_KEY;
  if (!rawKey) {
    return scryptSync("fleetnexus-dev-payment-key", "salt", 32);
  }
  if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    return Buffer.from(rawKey, "hex");
  }
  const decoded = Buffer.from(rawKey, "base64");
  if (decoded.length === 32) return decoded;
  return scryptSync(rawKey, "fleetnexus-payment-credentials", 32);
}

function encryptPaymentCredentials(plaintext, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(plaintext), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

async function main() {
  loadDotEnv();

  const clientId = process.env.PAYPAL_SANDBOX_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_SANDBOX_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    console.error(
      "Missing PAYPAL_SANDBOX_CLIENT_ID or PAYPAL_SANDBOX_CLIENT_SECRET in environment or apps/api/.env",
    );
    process.exit(1);
  }

  const credentials = {
    client_id: clientId,
    client_secret: clientSecret,
    environment: "sandbox",
  };

  const prisma = new PrismaClient();
  const encryptionKey = resolveEncryptionKey();

  try {
    const gateway = await prisma.paymentGateway.upsert({
      where: {
        type_name: { type: PaymentGatewayType.paypal, name: "PayPal Primary" },
      },
      update: {
        is_active: true,
        encrypted_credentials: encryptPaymentCredentials(credentials, encryptionKey),
        settings: { default_currency: "USD", environment: "sandbox" },
      },
      create: {
        name: "PayPal Primary",
        type: PaymentGatewayType.paypal,
        is_active: true,
        encrypted_credentials: encryptPaymentCredentials(credentials, encryptionKey),
        settings: { default_currency: "USD", environment: "sandbox" },
      },
      select: { id: true, name: true, type: true, is_active: true, updated_at: true },
    });

    console.log(
      JSON.stringify(
        {
          ok: true,
          message: "PayPal Primary gateway credentials updated",
          gateway,
          environment: "sandbox",
          client_id_prefix: `${clientId.slice(0, 8)}…`,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
