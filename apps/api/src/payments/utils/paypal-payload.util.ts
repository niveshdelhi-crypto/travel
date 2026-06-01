export type PayPalApiErrorPayload = {
  name?: string;
  message?: string;
  details?: Array<{ issue?: string; description?: string }>;
};

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

/** Human-readable message from PayPal REST error JSON. */
export function formatPaypalApiError(payload: PayPalApiErrorPayload): string {
  const detail = payload.details?.[0];
  if (detail?.description?.trim()) return detail.description.trim();
  if (detail?.issue?.trim()) return detail.issue.replace(/_/g, " ");
  if (payload.message?.trim()) return payload.message.trim();
  if (payload.name?.trim()) return payload.name.replace(/_/g, " ");
  return "PayPal request failed";
}

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

export function getPaypalOrderStatus(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const status = (raw as PayPalOrderPayload).status;
  return status?.trim() ? status.trim().toUpperCase() : undefined;
}

/** True only when PayPal reports a completed order with at least one capture record. */
export function isPaypalOrderCaptured(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const payload = raw as PayPalOrderPayload;
  if (getPaypalOrderStatus(payload) !== "COMPLETED") return false;
  const capture = payload.purchase_units?.[0]?.payments?.captures?.[0];
  if (!capture?.id?.trim()) return false;
  const captureStatus = capture.status?.trim().toUpperCase();
  return !captureStatus || captureStatus === "COMPLETED" || captureStatus === "PARTIALLY_REFUNDED";
}
