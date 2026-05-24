"use client";

import { apiRequest } from "@/lib/api";
import type { CallRecord, CreateOutboundCallInput } from "@/lib/calls/types";

export const callsService = {
  createOutbound(input: CreateOutboundCallInput) {
    return apiRequest<CallRecord>({
      url: "/calls/outbound",
      method: "POST",
      data: input,
    });
  },

  registerInbound(input: {
    from_number: string;
    to_number: string;
    provider_call_id?: string;
    lead_id?: string;
  }) {
    return apiRequest<CallRecord>({
      url: "/calls/inbound",
      method: "POST",
      data: input,
    });
  },
};
