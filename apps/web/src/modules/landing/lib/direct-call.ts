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
  return phone || "";
}

export function isDirectCallConfigured(): boolean {
  return Boolean(getDirectCallTelHref());
}
