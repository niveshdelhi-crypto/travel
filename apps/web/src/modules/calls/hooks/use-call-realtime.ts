"use client";

import { useEffect } from "react";
import { getCallSocketState, onCallEvent } from "@/lib/calls/socket";
import { useCallsStore } from "@/lib/calls/store";
import type { CallSocketEvent } from "@/lib/calls/types";
import type { UserRole } from "@/lib/auth/types";

const CALL_EVENTS: CallSocketEvent[] = [
  "CALL_CREATED",
  "CALL_RINGING",
  "CALL_ANSWERED",
  "CALL_COMPLETED",
  "CALL_FAILED",
];

export function useCallRealtime(options: { userId: string; role: UserRole }) {
  const applyRealtimeEvent = useCallsStore((state) => state.applyRealtimeEvent);
  const setSocketConnected = useCallsStore((state) => state.setSocketConnected);
  const isAdmin = options.role === "admin";

  useEffect(() => {
    const socketApi = getCallSocketState();
    setSocketConnected(socketApi.connected);

    const offConnect = socketApi.onConnect(() => setSocketConnected(true));
    const offDisconnect = socketApi.onDisconnect(() => setSocketConnected(false));

    if (!socketApi.connected) socketApi.connect();

    const disposers = CALL_EVENTS.map((event) =>
      onCallEvent(event, (payload) => {
        applyRealtimeEvent(event, payload, {
          currentUserId: options.userId,
          isAdmin,
        });
      }),
    );

    return () => {
      offConnect();
      offDisconnect();
      disposers.forEach((dispose) => dispose());
    };
  }, [applyRealtimeEvent, isAdmin, options.userId, setSocketConnected]);
}
