import { VONAGE_CALL_UUID_REGEX } from "../vonage-webhook.constants";

export function isValidVonageCallUuid(value: string | undefined | null): boolean {
  if (!value || typeof value !== "string") return false;
  return VONAGE_CALL_UUID_REGEX.test(value.trim());
}

export function assertValidVonageCallUuid(
  value: string | undefined | null,
  fieldName: string,
): void {
  if (value === undefined || value === null || value === "") return;
  if (!isValidVonageCallUuid(value)) {
    throw new Error(`Invalid Vonage call UUID format for ${fieldName}`);
  }
}
