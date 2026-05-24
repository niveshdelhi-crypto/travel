"use client";

import { create } from "zustand";
import type {
  AgentPresence,
  CallRecord,
  CallRealtimePayload,
  CallSocketEvent,
  CallStatus,
  LiveCallSession,
} from "./types";

const TERMINAL_STATUSES: CallStatus[] = ["COMPLETED", "FAILED", "BUSY", "NO_ANSWER", "CANCELLED"];

const ACTIVE_STATUSES: CallStatus[] = ["INITIATED", "RINGING", "ANSWERED"];

type CallsUiState = {
  presence: AgentPresence;
  liveCalls: Record<string, LiveCallSession>;
  selectedCallId: string | null;
  selectedLeadId: string | null;
  dialValue: string;
  isDialerOpen: boolean;
  showTransferPlaceholder: boolean;
  socketConnected: boolean;
  lastError: string | null;
};

type CallsUiActions = {
  setPresence: (presence: AgentPresence) => void;
  setSocketConnected: (connected: boolean) => void;
  setLastError: (message: string | null) => void;
  selectLead: (leadId: string | null) => void;
  selectCall: (callId: string | null) => void;
  setDialValue: (value: string) => void;
  appendDialDigit: (digit: string) => void;
  setDialerOpen: (open: boolean) => void;
  setShowTransferPlaceholder: (open: boolean) => void;
  upsertFromApi: (call: CallRecord) => void;
  applyRealtimeEvent: (
    event: CallSocketEvent,
    payload: CallRealtimePayload,
    options?: { currentUserId?: string; isAdmin?: boolean },
  ) => void;
  setCallMute: (callId: string, muted: boolean) => void;
  setCallHold: (callId: string, onHold: boolean) => void;
  endCallSession: (callId: string) => void;
  visibleLiveCalls: (options: { currentUserId: string; isAdmin: boolean }) => LiveCallSession[];
  syncPresenceFromCalls: (currentUserId: string) => void;
};

function toLiveCall(
  partial: Partial<LiveCallSession> & Pick<LiveCallSession, "id" | "status" | "direction">,
  existing?: LiveCallSession,
): LiveCallSession {
  const now = new Date().toISOString();
  return {
    id: partial.id,
    provider: partial.provider ?? existing?.provider ?? "VONAGE",
    provider_call_id: partial.provider_call_id ?? existing?.provider_call_id ?? null,
    direction: partial.direction,
    status: partial.status,
    from_number: partial.from_number ?? existing?.from_number ?? "",
    to_number: partial.to_number ?? existing?.to_number ?? "",
    agent_id: partial.agent_id ?? existing?.agent_id ?? null,
    lead_id: partial.lead_id ?? existing?.lead_id ?? null,
    started_at: partial.started_at ?? existing?.started_at ?? null,
    answered_at: partial.answered_at ?? existing?.answered_at ?? null,
    ended_at: partial.ended_at ?? existing?.ended_at ?? null,
    duration_seconds: partial.duration_seconds ?? existing?.duration_seconds ?? null,
    failure_reason: partial.failure_reason ?? existing?.failure_reason ?? null,
    created_at: partial.created_at ?? existing?.created_at ?? now,
    updated_at: partial.updated_at ?? now,
    isMuted: partial.isMuted ?? existing?.isMuted ?? false,
    isOnHold: partial.isOnHold ?? existing?.isOnHold ?? false,
    lastEventAt: partial.lastEventAt ?? now,
  };
}

function shouldTrackForUser(
  call: Pick<LiveCallSession, "agent_id" | "status">,
  currentUserId: string,
  isAdmin: boolean,
) {
  if (isAdmin) return true;
  return call.agent_id === currentUserId;
}

export const useCallsStore = create<CallsUiState & CallsUiActions>((set, get) => ({
  presence: "available",
  liveCalls: {},
  selectedCallId: null,
  selectedLeadId: null,
  dialValue: "",
  isDialerOpen: false,
  showTransferPlaceholder: false,
  socketConnected: false,
  lastError: null,

  setPresence: (presence) => set({ presence }),

  setSocketConnected: (socketConnected) => set({ socketConnected }),

  setLastError: (lastError) => set({ lastError }),

  selectLead: (selectedLeadId) => set({ selectedLeadId }),

  selectCall: (selectedCallId) => set({ selectedCallId }),

  setDialValue: (dialValue) => set({ dialValue }),

  appendDialDigit: (digit) =>
    set((state) => ({ dialValue: `${state.dialValue}${digit}`.slice(0, 20) })),

  setDialerOpen: (isDialerOpen) => set({ isDialerOpen }),

  setShowTransferPlaceholder: (showTransferPlaceholder) => set({ showTransferPlaceholder }),

  upsertFromApi: (call) => {
    const live = toLiveCall(call, get().liveCalls[call.id]);
    set((state) => ({
      liveCalls: { ...state.liveCalls, [call.id]: live },
      selectedCallId: state.selectedCallId ?? call.id,
    }));
  },

  applyRealtimeEvent: (event, payload, options) => {
    const { currentUserId = "", isAdmin = false } = options ?? {};
    if (!shouldTrackForUser(payload, currentUserId, isAdmin) && !isAdmin) return;

    const existing = get().liveCalls[payload.id];
    const eventAt = payload._realtime?.emittedAt ?? new Date().toISOString();
    const status = payload.status;
    const failure_reason = payload.failure_reason ?? existing?.failure_reason ?? null;

    let started_at = existing?.started_at ?? null;
    let answered_at = existing?.answered_at ?? null;
    let ended_at = existing?.ended_at ?? null;

    if (status === "RINGING" && !started_at) started_at = eventAt;
    if (status === "ANSWERED" && !answered_at) answered_at = eventAt;
    if (TERMINAL_STATUSES.includes(status)) ended_at = eventAt;

    const merged = toLiveCall(
      {
        ...existing,
        id: payload.id,
        status,
        direction: payload.direction,
        agent_id: payload.agent_id,
        lead_id: payload.lead_id,
        provider_call_id: payload.provider_call_id,
        failure_reason,
        started_at,
        answered_at,
        ended_at,
        lastEventAt: eventAt,
      },
      existing,
    );

    set((state) => {
      const liveCalls = { ...state.liveCalls, [payload.id]: merged };
      if (TERMINAL_STATUSES.includes(status)) {
        const { [payload.id]: _removed, ...rest } = liveCalls;
        return {
          liveCalls: rest,
          selectedCallId: state.selectedCallId === payload.id ? null : state.selectedCallId,
        };
      }
      return {
        liveCalls,
        selectedCallId: state.selectedCallId ?? payload.id,
        selectedLeadId: state.selectedLeadId ?? payload.lead_id ?? state.selectedLeadId,
      };
    });

    if (payload.lead_id) {
      set((state) => ({
        selectedLeadId: state.selectedLeadId ?? payload.lead_id,
      }));
    }

    get().syncPresenceFromCalls(currentUserId);

    if (event === "CALL_FAILED") {
      set({
        lastError: failure_reason ?? "Call failed",
      });
    }
  },

  setCallMute: (callId, isMuted) =>
    set((state) => {
      const call = state.liveCalls[callId];
      if (!call) return state;
      return { liveCalls: { ...state.liveCalls, [callId]: { ...call, isMuted } } };
    }),

  setCallHold: (callId, isOnHold) =>
    set((state) => {
      const call = state.liveCalls[callId];
      if (!call) return state;
      return { liveCalls: { ...state.liveCalls, [callId]: { ...call, isOnHold } } };
    }),

  endCallSession: (callId) =>
    set((state) => {
      const { [callId]: _removed, ...liveCalls } = state.liveCalls;
      return {
        liveCalls,
        selectedCallId: state.selectedCallId === callId ? null : state.selectedCallId,
        presence: Object.keys(liveCalls).length > 0 ? "on_call" : "available",
      };
    }),

  visibleLiveCalls: ({ currentUserId, isAdmin }) => {
    const calls = Object.values(get().liveCalls).filter((call) =>
      ACTIVE_STATUSES.includes(call.status),
    );
    if (isAdmin) return calls.sort((a, b) => b.lastEventAt.localeCompare(a.lastEventAt));
    return calls
      .filter((call) => call.agent_id === currentUserId)
      .sort((a, b) => b.lastEventAt.localeCompare(a.lastEventAt));
  },

  syncPresenceFromCalls: (currentUserId) => {
    const { presence, liveCalls } = get();
    if (presence === "offline" || presence === "busy") return;

    const hasActive = Object.values(liveCalls).some(
      (call) => call.agent_id === currentUserId && ACTIVE_STATUSES.includes(call.status),
    );

    set({ presence: hasActive ? "on_call" : "available" });
  },
}));
