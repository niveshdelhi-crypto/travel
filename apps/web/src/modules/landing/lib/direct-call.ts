import { DIRECT_CALL_PHONE_NUMBER } from "./constants";

function resolvePhone(): string {
  const fromEnv = process.env.NEXT_PUBLIC_DIRECT_CALL_PHONE?.trim();
  if (fromEnv) return fromEnv;
  return DIRECT_CALL_PHONE_NUMBER.trim();
}

const RAW = resolvePhone();

export function getDirectCallPhone(): string | null {
  if (!RAW) return null;
  return RAW;
}

export function getDirectCallTelHref(phone = RAW): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7) return null;
  if (trimmed.startsWith("+")) {
    return `tel:${trimmed.replace(/[\s()-]/g, "")}`;
  }
  return `tel:+${digits}`;
}

export function formatDirectCallLabel(phone = RAW): string {
  if (!phone) return "";
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");

  if ((trimmed.startsWith("+1") || (!trimmed.startsWith("+") && digits.length === 10)) && digits.length >= 10) {
    const national = digits.length === 11 ? digits.slice(1) : digits;
    return `+1 (${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6, 10)}`;
  }

  if (trimmed.startsWith("+") && digits.length >= 10) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`.trim();
  }

  return trimmed;
}

export function isDirectCallConfigured(): boolean {
  return Boolean(getDirectCallTelHref());
}
