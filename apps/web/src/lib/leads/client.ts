"use client";

import { leadsService } from "@/services/leads.service";
import type { CreateLeadInput, Lead, LeadListParams, LeadMetrics, LeadStatus } from "./types";

export function createLead(input: CreateLeadInput) {
  return leadsService.createLead(input);
}

export function listLeads(params?: LeadListParams) {
  return leadsService.listLeads(params);
}

export function getLeadMetrics() {
  return leadsService.getLeadMetrics();
}

export function updateLead(id: string, input: { status?: LeadStatus; booking_value?: number }) {
  return leadsService.updateLead(id, input);
}

export function addLeadNote(id: string, body: string) {
  return leadsService.addLeadNote(id, body);
}

export function recordCall(id: string) {
  return leadsService.recordCall(id);
}
