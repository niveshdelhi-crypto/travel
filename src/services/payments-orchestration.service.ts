import { apiClient } from "./api-client";
import type {
  AuditLogRow,
  BookingPaymentRequestRow,
  PaginatedOrchestration,
  PaymentGatewayRow,
  PaymentSessionDetail,
  PaymentSessionMetrics,
  PaymentSessionAttemptRow,
  PaymentSessionQueueItem,
  QuickCollectPaymentResponse,
  CheckoutConfigResponse,
  CheckoutPrepareResponse,
  CreateCheckoutOrderResponse,
  GatewayHealthRow,
  PaymentTransactionRow,
  OrchestrationPaymentStatus,
} from "@/types/payments-orchestration";

export const paymentsOrchestrationService = {
  listGateways() {
    return apiClient.get<PaymentGatewayRow[]>("/payments/gateways");
  },

  listTransactions(params?: {
    page?: number;
    pageSize?: number;
    status?: OrchestrationPaymentStatus;
  }) {
    return apiClient.get<PaginatedOrchestration<PaymentTransactionRow>>("/payments/transactions", {
      params,
    });
  },

  getTransaction(id: string) {
    return apiClient.get<PaymentTransactionRow>(`/payments/transactions/${id}`);
  },

  processTransaction(id: string) {
    return apiClient.post<PaymentTransactionRow>(`/payments/transactions/${id}/process`);
  },

  captureTransaction(id: string) {
    return apiClient.post<PaymentTransactionRow>(`/payments/transactions/${id}/capture`);
  },

  refundTransaction(id: string, reason?: string) {
    return apiClient.post<PaymentTransactionRow>(`/payments/transactions/${id}/refund`, { reason });
  },

  listBookingRequests(params?: { page?: number; pageSize?: number }) {
    return apiClient.get<PaginatedOrchestration<BookingPaymentRequestRow>>(
      "/payments/booking-requests",
      { params },
    );
  },

  processBookingRequest(id: string) {
    return apiClient.post<BookingPaymentRequestRow>(`/payments/booking-requests/${id}/process`);
  },

  listAuditLogs(params?: { page?: number; pageSize?: number }) {
    return apiClient.get<PaginatedOrchestration<AuditLogRow>>("/payments/audit-logs", { params });
  },

  createPaymentSession(body: {
    booking_id: string;
    gateway_id: string;
    amount: number;
    currency: string;
    finance_notes?: string;
  }) {
    return apiClient.post<PaymentSessionDetail>("/payment-sessions", body);
  },

  quickCollectPayment(body: {
    customer_name: string;
    amount: number;
    customer_email: string;
    customer_phone: string;
    currency?: string;
  }) {
    return apiClient.post<QuickCollectPaymentResponse>("/payment-sessions/quick-collect", body);
  },

  listPaymentSessionQueue() {
    return apiClient.get<PaymentSessionQueueItem[]>("/payment-sessions/queue");
  },

  getPaymentSessionMetrics() {
    return apiClient.get<PaymentSessionMetrics>("/payment-sessions/metrics");
  },

  getPaymentSession(id: string) {
    return apiClient.get<PaymentSessionDetail>(`/payment-sessions/${id}`);
  },

  getPaymentSessionAudit(id: string) {
    return apiClient.get<AuditLogRow[]>(`/payment-sessions/${id}/audit`);
  },

  startPaymentSession(id: string) {
    return apiClient.post<PaymentSessionDetail>(`/payment-sessions/${id}/start`);
  },

  completePaymentSession(id: string, body?: { provider_reference?: string; finance_notes?: string }) {
    return apiClient.post<PaymentSessionDetail>(`/payment-sessions/${id}/complete`, body ?? {});
  },

  failPaymentSession(id: string, body: { failure_reason: string; finance_notes?: string }) {
    return apiClient.post<PaymentSessionDetail>(`/payment-sessions/${id}/fail`, body);
  },

  cancelPaymentSession(id: string) {
    return apiClient.post<PaymentSessionDetail>(`/payment-sessions/${id}/cancel`);
  },

  getCheckoutConfig(id: string) {
    return apiClient.get<CheckoutConfigResponse>(`/payment-sessions/${id}/checkout-config`);
  },

  prepareCheckout(id: string) {
    return apiClient.post<CheckoutPrepareResponse>(`/payment-sessions/${id}/checkout/prepare`, {});
  },

  createCheckoutOrder(id: string) {
    return apiClient.post<CreateCheckoutOrderResponse>(`/payment-sessions/${id}/checkout/create-order`);
  },

  captureCheckoutOrder(id: string, body: { order_id: string; finance_notes?: string }) {
    return apiClient.post<PaymentSessionDetail>(`/payment-sessions/${id}/checkout/capture`, body);
  },

  recordCheckoutFailure(
    id: string,
    body: { failure_reason: string; order_id?: string; finance_notes?: string },
  ) {
    return apiClient.post<PaymentSessionDetail>(`/payment-sessions/${id}/checkout/record-failure`, body);
  },

  markCheckoutSubmitted(id: string, orderId: string) {
    return apiClient.post(`/payment-sessions/${id}/checkout/submitted`, { order_id: orderId });
  },

  updateFinanceNotes(id: string, financeNotes: string) {
    return apiClient.patch<PaymentSessionDetail>(`/payment-sessions/${id}/finance-notes`, {
      finance_notes: financeNotes,
    });
  },

  listPaymentSessionAttempts(id: string) {
    return apiClient.get<PaymentSessionAttemptRow[]>(`/payment-sessions/${id}/attempts`);
  },

  getGatewayHealth() {
    return apiClient.get<import("@/types/payments-orchestration").PaymentGatewayHealthResponse>(
      "/payments/gateway-health",
    );
  },

  getFinanceGatewayHealth() {
    return apiClient.get<GatewayHealthRow[]>("/payment-sessions/gateway-health");
  },
};
