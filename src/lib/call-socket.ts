import { getSocket } from "@/services/socket";
import type { CallRealtimePayload, CallSocketEvent } from "@/types/calls";

export function onCallEvent(
  event: CallSocketEvent,
  handler: (payload: CallRealtimePayload) => void,
) {
  const socket = getSocket();
  const listener = (...args: unknown[]) => handler(args[0] as CallRealtimePayload);
  socket.on(event, listener);
  return () => socket.off(event, listener);
}

export function getCallSocketState() {
  const socket = getSocket();
  return {
    connected: socket.connected,
    connect: () => socket.connect(),
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
