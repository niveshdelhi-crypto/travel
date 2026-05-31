export type PayPalOrderPayload = {
  id?: string;
  status?: string;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{ id?: string; status?: string; amount?: { value?: string; currency_code?: string } }>;
      authorizations?: Array<{ id?: string; status?: string }>;
    };
  }>;
};

export function extractPaypalOrderId(raw: unknown, fallback?: string | null): string | undefined {
  if (fallback?.trim()) return fallback.trim();
  if (!raw || typeof raw !== "object") return undefined;
  const payload = raw as PayPalOrderPayload;
  if (payload.id?.trim()) return payload.id.trim();
  return undefined;
}

export function extractPaypalCaptureId(raw: unknown, fallback?: string | null): string | undefined {
  if (fallback?.trim()) return fallback.trim();
  if (!raw || typeof raw !== "object") return undefined;
  const payload = raw as PayPalOrderPayload;
  const captureId = payload.purchase_units?.[0]?.payments?.captures?.[0]?.id;
  if (captureId?.trim()) return captureId.trim();
  return undefined;
}

export function extractPaypalAuthorizationId(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const payload = raw as PayPalOrderPayload;
  const authId = payload.purchase_units?.[0]?.payments?.authorizations?.[0]?.id;
  if (authId?.trim()) return authId.trim();
  return undefined;
}
