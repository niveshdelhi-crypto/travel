/** Normalize user-entered phone strings to E.164 for Vonage and validation. */
export function normalizeToE164(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return trimmed;

  if (trimmed.startsWith("+")) {
    return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length >= 8) return `+${digits}`;

  return trimmed;
}

export function isPlausibleE164(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}
