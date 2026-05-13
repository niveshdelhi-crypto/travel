// ============================================================
// FleetNexus — Socket.IO Real-time Client
// Manages persistent WebSocket connection with auto-reconnect,
// event typing, and store integration
// ============================================================

import { io, Socket } from "socket.io-client";
import { SOCKET_URL, SOCKET_RECONNECT_ATTEMPTS } from "@/constants";
import type { SocketEvents } from "@/types";

type SocketEvent = keyof SocketEvents;
type SocketEventData<E extends SocketEvent> = SocketEvents[E];

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket || !socket.connected) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      reconnectionAttempts: SOCKET_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 5_000,
      transports: ["websocket", "polling"],
      autoConnect: false,
    });

    socket.on("connect", () => {
      console.info("[Socket] Connected:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.info("[Socket] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("[Socket] Connection error:", err.message);
    });

    socket.connect();
  }

  return socket;
}

// ─── Typed event subscriptions ────────────────────────────────

export function onSocketEvent<E extends SocketEvent>(
  event: E,
  handler: (data: SocketEventData<E>) => void,
): () => void {
  const s = getSocket();
  s.on(event as string, handler as (...args: unknown[]) => void);
  return () => s.off(event as string, handler as (...args: unknown[]) => void);
}

export function emitSocketEvent<E extends SocketEvent>(
  event: E,
  data: SocketEventData<E>,
): void {
  getSocket().emit(event, data);
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocketStatus(): "connected" | "connecting" | "disconnected" {
  if (!socket) return "disconnected";
  if (socket.connected) return "connected";
  return "connecting";
}

export { getSocket };
