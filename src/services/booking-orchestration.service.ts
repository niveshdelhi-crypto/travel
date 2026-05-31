import { apiClient } from "./api-client";

export type BookingLifecycleStatus =
  | "BOOKING_REQUESTED"
  | "PAYMENT_PENDING"
  | "PAYMENT_PROCESSING"
  | "PAYMENT_SUCCESS"
  | "SUPPLIER_BOOKING_PENDING"
  | "BOOKING_CONFIRMED"
  | "VOUCHER_GENERATED"
  | "CUSTOMER_NOTIFIED"
  | "COMPLETED"
  | "PAYMENT_FAILED"
  | "BOOKING_FAILED"
  | "REFUND_PENDING"
  | "REFUNDED"
  | "CHARGEBACK"
  | "CANCELLED";

export type OperationsBookingRow = {
  id: string;
  lifecycle_status: BookingLifecycleStatus;
  gross_revenue: string | number;
  currency: string;
  created_at: string;
  updated_at: string;
  lead: {
    customer_name: string;
    pickup_location: string;
    drop_location: string;
    assigned_to: string | null;
  };
  traveler: {
    id: string;
    full_name: string;
    is_recurring: boolean;
    is_vip: boolean;
  } | null;
  supplier: { id: string; name: string } | null;
};

export type FinanceOverview = {
  revenueToday: number;
  revenueMonth: number;
  transactionsToday: number;
  transactionsMonth: number;
  gatewaySuccessRate: Array<{ name: string; success: number; total: number; rate: number }>;
  successfulTransactions: number;
  failedTransactions: number;
  pendingRefunds: number;
  recurringRevenueTravelers: number;
  supplierPayoutPending: number;
  bookingsInProgress: number;
  topAgents: Array<{ agentId: string | null; agentName: string; bookings: number; revenue: number }>;
};

export type InitiatedBooking = {
  id: string;
  lead_id: string;
  gross_revenue: string | number;
  currency: string;
  lifecycle_status: BookingLifecycleStatus;
  status: string;
};

export type PaymentRequestResult = {
  booking: InitiatedBooking;
  session: import("@/types/payments-orchestration").PaymentSessionDetail;
  queue_item: {
    id: string;
    customer_name: string;
    booking_id: string;
    lead_id: string;
    amount: number;
    currency: string;
    agent_name: string;
    gateway_name: string;
    gateway_type: string;
    status: string;
    created_at: string;
    expires_at: string;
    checkout_path: string;
  };
  checkout_path: string;
};

export const bookingOrchestrationService = {
  initiateBooking(body: {
    lead_id: string;
    gross_revenue: number;
    currency?: string;
    partner_name?: string;
    confirmation_reference?: string;
    notes?: string;
    supplier_id?: string;
    vehicle_id?: string;
    idempotency_key?: string;
  }) {
    return apiClient.post<InitiatedBooking>("/booking-operations/initiate", body);
  },

  requestPayment(bookingId: string) {
    return apiClient.post<PaymentRequestResult>(
      `/booking-operations/bookings/${bookingId}/request-payment`,
    );
  },

  requestPaymentForLead(body: {
    lead_id: string;
    gross_revenue: number;
    currency?: string;
    partner_name?: string;
    confirmation_reference?: string;
    notes?: string;
    supplier_id?: string;
    vehicle_id?: string;
    finance_notes?: string;
    idempotency_key?: string;
  }) {
    return apiClient.post<PaymentRequestResult>("/booking-operations/request-payment", body);
  },

  listQueue(params?: { page?: number; pageSize?: number }) {
    return apiClient.get<{
      data: OperationsBookingRow[];
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    }>("/booking-operations/queue", { params });
  },

  financeOverview() {
    return apiClient.get<FinanceOverview>("/booking-operations/finance/overview");
  },

  listTravelers(params?: { page?: number; pageSize?: number; recurringOnly?: boolean; vipOnly?: boolean }) {
    return apiClient.get("/booking-operations/travelers", { params });
  },

  getTraveler(id: string) {
    return apiClient.get(`/booking-operations/travelers/${id}`);
  },

  listRefundQueue() {
    return apiClient.get("/booking-operations/refunds/queue");
  },

  listSupplierQueue() {
    return apiClient.get("/booking-operations/suppliers/queue");
  },

  listSuppliers() {
    return apiClient.get("/booking-operations/suppliers");
  },

  getTimeline(bookingId: string) {
    return apiClient.get(`/booking-operations/bookings/${bookingId}/timeline`);
  },

  listDocuments(bookingId: string) {
    return apiClient.get(`/booking-operations/bookings/${bookingId}/documents`);
  },

  generateVoucher(bookingId: string) {
    return apiClient.post(`/booking-operations/bookings/${bookingId}/vouchers`);
  },

  generateInvoice(bookingId: string) {
    return apiClient.post(`/booking-operations/bookings/${bookingId}/invoices`);
  },

  approveRefund(refundId: string) {
    return apiClient.post(`/booking-operations/refunds/${refundId}/approve`);
  },

  processRefund(refundId: string) {
    return apiClient.post(`/booking-operations/refunds/${refundId}/process`);
  },
};
