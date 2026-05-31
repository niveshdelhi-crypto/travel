import { apiClient } from "./api-client";

export type PayPalEnvironment = "sandbox" | "live";

export type PaymentTestingCaptureRow = {
  id: string;
  source: "session_attempt" | "transaction";
  paypal_order_id: string | null;
  paypal_capture_id: string | null;
  gateway_id: string;
  gateway_name: string;
  environment: PayPalEnvironment;
  amount: number;
  currency: string;
  customer_name: string;
  booking_id: string;
  lead_id: string;
  session_id: string | null;
  transaction_id: string | null;
  status: string;
  captured_at: string;
};

export type PaymentTestingFailureRow = {
  id: string;
  source: "session_attempt" | "transaction";
  paypal_order_id: string | null;
  gateway_name: string;
  environment: PayPalEnvironment;
  amount: number;
  currency: string;
  customer_name: string;
  booking_id: string;
  failure_reason: string | null;
  failed_at: string;
};

export type PaymentTestingRefundRow = {
  id: string;
  paypal_capture_id: string | null;
  paypal_refund_id: string | null;
  gateway_name: string;
  environment: PayPalEnvironment;
  amount: number;
  currency: string;
  customer_name: string;
  booking_id: string;
  refunded_at: string;
};

export type PaymentTestingConsole = {
  environment: PayPalEnvironment;
  gateways: Array<{ id: string; name: string; environment: PayPalEnvironment }>;
  recent_captures: PaymentTestingCaptureRow[];
  recent_failures: PaymentTestingFailureRow[];
  recent_refunds: PaymentTestingRefundRow[];
};

export type AuditLogEntry = {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
  user: { id: string; name: string; email: string; role: string } | null;
};

export const paymentTestingService = {
  getConsole(environment: PayPalEnvironment) {
    return apiClient.get<PaymentTestingConsole>("/payments/testing/console", {
      params: { environment },
    });
  },

  listCaptures(environment: PayPalEnvironment, limit = 50) {
    return apiClient.get<PaymentTestingCaptureRow[]>("/payments/testing/captures", {
      params: { environment, limit },
    });
  },

  listFailures(environment: PayPalEnvironment, limit = 50) {
    return apiClient.get<PaymentTestingFailureRow[]>("/payments/testing/failures", {
      params: { environment, limit },
    });
  },

  listRefunds(environment: PayPalEnvironment, limit = 50) {
    return apiClient.get<PaymentTestingRefundRow[]>("/payments/testing/refunds", {
      params: { environment, limit },
    });
  },

  getAudit(resourceType: string, resourceId: string) {
    return apiClient.get<AuditLogEntry[]>(`/payments/testing/audit/${resourceType}/${resourceId}`);
  },

  retryCapture(body: {
    attempt_id?: string;
    order_id?: string;
    session_id?: string;
  }) {
    return apiClient.post("/payments/testing/retry-capture", body);
  },

  voidOrder(body: { attempt_id?: string; order_id?: string; session_id?: string }) {
    return apiClient.post("/payments/testing/void-order", body);
  },

  refund(body: {
    attempt_id?: string;
    order_id?: string;
    session_id?: string;
    transaction_id?: string;
    capture_id?: string;
    amount?: number;
    reason?: string;
  }) {
    return apiClient.post("/payments/testing/refund", body);
  },
};
