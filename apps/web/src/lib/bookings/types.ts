export type BookingListItem = {
  id: string;
  lead_id: string;
  gross_revenue: string | number;
  currency: string;
  partner_name: string | null;
  confirmation_reference: string | null;
  created_at: string;
  lead: {
    id: string;
    customer_name: string;
    customer_email: string;
    pickup_location: string;
    drop_location: string;
    status: string;
    assigned_to: string | null;
  };
  recorder: { id: string; name: string; email: string } | null;
};

export type PaymentListItem = {
  id: string;
  booking_id: string;
  amount: string | number;
  currency: string;
  kind: string;
  memo: string | null;
  created_at: string;
  booking: {
    id: string;
    gross_revenue: string | number;
    partner_name: string | null;
    confirmation_reference: string | null;
    lead: {
      customer_name: string;
      pickup_location: string;
    };
  };
  recorder: { id: string; name: string; email: string } | null;
};

export type PaginatedBookings = {
  data: BookingListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedPayments = {
  data: PaymentListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
