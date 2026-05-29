import { apiClient } from "./api-client";
import type {
  AuditLogRow,
  BookingPaymentRequestRow,
  PaginatedOrchestration,
  PaymentGatewayRow,
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
};
