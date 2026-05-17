"use client";

import { useMutation } from "@tanstack/react-query";
import type { CreateLeadInput, PublicLeadResponse } from "@/lib/leads/types";
import { leadsService } from "@/services/leads.service";
import { createIdempotencyKey } from "../lib/utils";

export function useSearchLead() {
  return useMutation<PublicLeadResponse, Error, CreateLeadInput>({
    mutationFn: async (input) => leadsService.createLead(input, createIdempotencyKey()),
  });
}
