"use client";

import { getLeadSocket } from "@/lib/leads/socket";
import type { CallRealtimePayload, CallSocketEvent } from "./types";

type CallSocketHandlers = {
  [K in CallSocketEvent]: (payload: CallRealtimePayload) => void;
};

export function onCallEvent<EventName extends CallSocketEvent>(
  event: EventName,
  handler: CallSocketHandlers[EventName],
) {
  const socket = getLeadSocket();
  const listener = (...args: unknown[]) => {
    const payload = args[0] as CallRealtimePayload;
    handler(payload);
  };
  const eventName = event as string;
  socket.on(eventName, listener);
  return () => {
    socket.off(eventName, listener);
  };
}

export function getCallSocketState() {
  const socket = getLeadSocket();
  return {
    connected: socket.connected,
    connect: () => socket.connect(),
    disconnect: () => socket.disconnect(),
    onConnect: (handler: () => void) => {
      socket.on("connect", handler);
      return () => socket.off("connect", handler);
    },
    onDisconnect: (handler: () => void) => {
      socket.on("disconnect", handler);
      return () => socket.off("disconnect", handler);
    },
  };
}
