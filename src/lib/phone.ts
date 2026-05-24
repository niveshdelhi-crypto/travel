/** Client-side E.164 normalization (matches API phone.util). */
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

export function formatPhoneDisplay(phone: string): string {
  const e164 = normalizeToE164(phone);
  if (e164.length === 12 && e164.startsWith("+1")) {
    const d = e164.slice(2);
    return `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return phone.trim();
}
