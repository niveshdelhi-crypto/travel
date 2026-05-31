const SENSITIVE_KEYS = new Set([
  "number",
  "card_number",
  "cvv",
  "cvc",
  "security_code",
  "expiry",
  "expiration",
  "exp_month",
  "exp_year",
  "pan",
  "primary_account_number",
]);

export function sanitizeProviderResponse(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeProviderResponse(item));
  }
  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) continue;
      result[key] = sanitizeProviderResponse(nested);
    }
    return result;
  }
  return value;
}
