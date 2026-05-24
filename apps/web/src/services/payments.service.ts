"use client";

import { apiRequest } from "@/lib/api";
import type { PaginatedPayments } from "@/lib/bookings/types";

export const paymentsService = {
  list(params?: { page?: number; pageSize?: number }) {
    return apiRequest<PaginatedPayments>({
      url: "/payments",
      method: "GET",
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 25,
      },
    });
  },
};
