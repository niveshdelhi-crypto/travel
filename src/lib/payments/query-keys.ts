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
};
