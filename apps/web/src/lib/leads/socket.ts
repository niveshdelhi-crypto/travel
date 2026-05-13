"use client";

import { io, type Socket } from "socket.io-client";
import type { Lead, LeadNote } from "./types";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000/leads";
const EVENT_ID_TTL_MS = 2 * 60_000;

type LeadSocketEvents = {
  "lead.created": (lead: Lead) => void;
  "lead.assigned": (lead: Lead) => void;
  "lead.updated": (lead: Lead) => void;
  "lead.note.created": (note: LeadNote) => void;
  "notification.created": (notification: { type: string; leadId: string; message: string }) => void;
  "metrics.changed": () => void;
};

type RealtimeEnvelope = {
  _realtime?: {
    eventId?: string;
    emittedAt?: string;
  };
};

let socket: Socket | null = null;
const watchedLeadIds = new Set<string>();
const seenEventIds = new Map<string, number>();

export function getLeadSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Number.POSITIVE_INFINITY,
      reconnectionDelay: 750,
      reconnectionDelayMax: 10_000,
      randomizationFactor: 0.5,
      timeout: 20_000,
    });

    socket.on("connect", () => {
      for (const leadId of watchedLeadIds) {
        socket?.emit("lead:watch", leadId);
      }
    });
  }

  return socket;
}

export function onLeadEvent<EventName extends keyof LeadSocketEvents>(
  event: EventName,
  handler: LeadSocketEvents[EventName],
) {
  const activeSocket = getLeadSocket();
  const listener = (...args: unknown[]) => {
    if (isDuplicateRealtimeEvent(args[0])) return;
    (handler as (...handlerArgs: unknown[]) => void)(...args);
  };
  const eventName = event as string;
  activeSocket.on(eventName, listener);
  return () => activeSocket.off(eventName, listener);
}

export function watchLeadRoom(leadId: string) {
  watchedLeadIds.add(leadId);
  getLeadSocket().emit("lead:watch", leadId);

  return () => {
    watchedLeadIds.delete(leadId);
  };
}

export function disconnectLeadSocket() {
  socket?.disconnect();
  socket = null;
}

function isDuplicateRealtimeEvent(payload: unknown) {
  cleanupSeenEventIds();

  if (!payload || typeof payload !== "object") return false;

  const eventId = (payload as RealtimeEnvelope)._realtime?.eventId;
  if (!eventId) return false;

  if (seenEventIds.has(eventId)) return true;
  seenEventIds.set(eventId, Date.now() + EVENT_ID_TTL_MS);
  return false;
}

function cleanupSeenEventIds() {
  const now = Date.now();

  for (const [eventId, expiresAt] of seenEventIds) {
    if (expiresAt <= now) seenEventIds.delete(eventId);
  }
}
