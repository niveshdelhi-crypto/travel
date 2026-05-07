// ============================================================
// FleetNexus — Zustand Store: Call / Telephony
// ============================================================
import { create } from "zustand";
import type { ActiveCall, Call } from "@/types";

interface CallState {
  activeCall: ActiveCall | null;
  recentCalls: Call[];
  isDialerOpen: boolean;
  callTimer: number; // seconds elapsed
  timerInterval: ReturnType<typeof setInterval> | null;
}

interface CallActions {
  startCall: (call: ActiveCall) => void;
  endCall: () => void;
  setMute: (muted: boolean) => void;
  setHold: (onHold: boolean) => void;
  setRecording: (recording: boolean) => void;
  openDialer: () => void;
  closeDialer: () => void;
  setRecentCalls: (calls: Call[]) => void;
  _tick: () => void;
}

export const useCallStore = create<CallState & CallActions>((set, get) => ({
  activeCall: null,
  recentCalls: [],
  isDialerOpen: false,
  callTimer: 0,
  timerInterval: null,

  startCall: (call) => {
    const interval = setInterval(() => get()._tick(), 1_000);
    set({ activeCall: call, callTimer: 0, timerInterval: interval });
  },

  endCall: () => {
    const { timerInterval, activeCall } = get();
    if (timerInterval) clearInterval(timerInterval);

    // Archive to recent
    if (activeCall) {
      set((s) => ({
        recentCalls: [activeCall as unknown as Call, ...s.recentCalls].slice(0, 100),
      }));
    }

    set({ activeCall: null, callTimer: 0, timerInterval: null });
  },

  setMute: (muted) =>
    set((s) =>
      s.activeCall ? { activeCall: { ...s.activeCall, isMuted: muted } } : {},
    ),

  setHold: (onHold) =>
    set((s) =>
      s.activeCall ? { activeCall: { ...s.activeCall, isOnHold: onHold } } : {},
    ),

  setRecording: (isRecording) =>
    set((s) =>
      s.activeCall ? { activeCall: { ...s.activeCall, isRecording } } : {},
    ),

  openDialer: () => set({ isDialerOpen: true }),
  closeDialer: () => set({ isDialerOpen: false }),

  setRecentCalls: (recentCalls) => set({ recentCalls }),

  _tick: () => set((s) => ({ callTimer: s.callTimer + 1 })),
}));

// ─── Timer formatter helper ───────────────────────────────────
export function formatCallTimer(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
