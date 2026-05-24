export const VONAGE_WEBHOOK_ENV_KEYS = {
  SIGNATURE_SECRET: "VONAGE_SIGNATURE_SECRET",
  SIGNATURE_REQUIRED: "VONAGE_WEBHOOK_SIGNATURE_REQUIRED",
  IP_ALLOWLIST: "VONAGE_WEBHOOK_IP_ALLOWLIST",
  TIMESTAMP_TOLERANCE_SECONDS: "VONAGE_WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS",
} as const;

/** Vonage Voice / Messages signed webhook JWT header variants */
export const VONAGE_SIGNATURE_HEADERS = [
  "authorization",
  "vonage-signature",
  "x-vonage-signature",
] as const;

export const DEFAULT_WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS = 300;

export const VONAGE_CALL_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const VONAGE_WEBHOOK_REPLAY_KEY_PREFIX = "fleetnexus:vonage:webhook:replay:";

export const VONAGE_WEBHOOK_REPLAY_TTL_MS = 5 * 60 * 1000 + 30_000;
