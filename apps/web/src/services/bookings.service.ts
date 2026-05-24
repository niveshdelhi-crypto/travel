"use client";

import { apiRequest } from "@/lib/api";
import type { CloseLeadBookingPayload, CloseLeadBookingResponse } from "@/lib/bookings/close-lead";
import type { PaginatedBookings } from "@/lib/bookings/types";

export const bookingsService = {
  list(params?: { page?: number; pageSize?: number }) {
    return apiRequest<PaginatedBookings>({
      url: "/bookings",
      method: "GET",
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 25,
      },
    });
  },

  closeLead(payload: CloseLeadBookingPayload) {
    return apiRequest<CloseLeadBookingResponse>({
      url: "/bookings/close-lead",
      method: "POST",
      data: payload,
    });
  },
};
