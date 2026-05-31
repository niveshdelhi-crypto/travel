export type CloseLeadBookingPayload = {
  lead_id: string;
  gross_revenue: number;
  currency?: string;
  partner_name?: string;
  confirmation_reference?: string;
  notes?: string;
};

export type CloseLeadBookingResponse = {
  booking: import("./types").BookingListItem;
  updatedLead: Pick<
    import("@/lib/leads/types").Lead,
    | "id"
    | "status"
    | "assigned_to"
    | "booking_value"
    | "customer_name"
    | "pickup_location"
    | "drop_location"
  >;
};
