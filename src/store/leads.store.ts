// ============================================================
// Book my Carz — Zustand Store: Leads
// ============================================================
import { create } from "zustand";
import type { Lead, LeadStage } from "@/types";

interface LeadState {
  leads: Lead[];
  selectedLead: Lead | null;
  stageFilter: LeadStage | "all";
  searchQuery: string;
  isLoading: boolean;
}

interface LeadActions {
  setLeads: (leads: Lead[]) => void;
  updateLead: (id: string, changes: Partial<Lead>) => void;
  moveLead: (id: string, stage: LeadStage) => void;
  selectLead: (lead: Lead | null) => void;
  setFilter: (stage: LeadStage | "all") => void;
  setSearch: (q: string) => void;
  setLoading: (loading: boolean) => void;
  getLeadsByStage: (stage: LeadStage) => Lead[];
}

export const useLeadStore = create<LeadState & LeadActions>((set, get) => ({
  leads: [],
  selectedLead: null,
  stageFilter: "all",
  searchQuery: "",
  isLoading: false,

  setLeads: (leads) => set({ leads }),

  updateLead: (id, changes) =>
    set((s) => ({
      leads: s.leads.map((l) => (l.id === id ? { ...l, ...changes } : l)),
      selectedLead: s.selectedLead?.id === id ? { ...s.selectedLead, ...changes } : s.selectedLead,
    })),

  moveLead: (id, stage) =>
    set((s) => ({
      leads: s.leads.map((l) => (l.id === id ? { ...l, stage } : l)),
    })),

  selectLead: (lead) => set({ selectedLead: lead }),

  setFilter: (stageFilter) => set({ stageFilter }),

  setSearch: (searchQuery) => set({ searchQuery }),

  setLoading: (isLoading) => set({ isLoading }),

  getLeadsByStage: (stage) =>
    get().leads.filter((l) => l.stage === stage),
}));
