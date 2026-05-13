"use client";

import { create } from "zustand";
import type { LeadStatus } from "./types";

type LeadUiState = {
  selectedLeadId: string | null;
  page: number;
  pageSize: number;
  status: LeadStatus | "ALL";
  setSelectedLeadId: (leadId: string | null) => void;
  setPage: (page: number) => void;
  setStatus: (status: LeadStatus | "ALL") => void;
};

export const useLeadUiStore = create<LeadUiState>((set) => ({
  selectedLeadId: null,
  page: 1,
  pageSize: 25,
  status: "ALL",
  setSelectedLeadId: (selectedLeadId) => set({ selectedLeadId }),
  setPage: (page) => set({ page }),
  setStatus: (status) => set({ status, page: 1, selectedLeadId: null }),
}));
