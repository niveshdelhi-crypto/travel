import type { PaymentConsoleFilters } from "@/types/payments-orchestration";

export const paymentQueryKeys = {
  root: ["payments-console"] as const,
  gateways: () => [...paymentQueryKeys.root, "gateways"] as const,
  transactions: (filters: PaymentConsoleFilters, page: number) =>
    [...paymentQueryKeys.root, "transactions", filters, page] as const,
  bookingRequests: () => [...paymentQueryKeys.root, "booking-requests"] as const,
  auditLogs: () => [...paymentQueryKeys.root, "audit-logs"] as const,
  bookingsIndex: () => [...paymentQueryKeys.root, "bookings-index"] as const,
  agents: () => [...paymentQueryKeys.root, "agents"] as const,
  ledger: (page: number) => [...paymentQueryKeys.root, "ledger", page] as const,
  paymentSessions: () => [...paymentQueryKeys.root, "payment-sessions"] as const,
  paymentSessionQueue: () => [...paymentQueryKeys.paymentSessions(), "queue"] as const,
  paymentSessionMetrics: () => [...paymentQueryKeys.paymentSessions(), "metrics"] as const,
  paymentSessionDetail: (id: string) =>
    [...paymentQueryKeys.paymentSessions(), "detail", id] as const,
  paymentSessionAudit: (id: string) =>
    [...paymentQueryKeys.paymentSessions(), "audit", id] as const,
  checkoutConfig: (id: string) =>
    [...paymentQueryKeys.paymentSessions(), "checkout-config", id] as const,
  paymentSessionAttempts: (id: string) =>
    [...paymentQueryKeys.paymentSessions(), "attempts", id] as const,
  gatewayHealth: () => [...paymentQueryKeys.paymentSessions(), "gateway-health"] as const,
  paymentsGatewayHealth: () => [...paymentQueryKeys.root, "payments-gateway-health"] as const,
};
