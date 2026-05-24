"use client";

import { useEffect, useMemo, useState } from "react";
import type { CallStatus } from "@/lib/calls/types";

function formatElapsed(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function useCallTimer(options: {
  status: CallStatus;
  startedAt: string | null;
  answeredAt: string | null;
  endedAt: string | null;
}) {
  const anchor = useMemo(() => {
    if (options.status === "ANSWERED" && options.answeredAt) {
      return { label: "Talk time", iso: options.answeredAt };
    }
    if (options.startedAt) {
      return {
        label: options.status === "RINGING" ? "Ringing" : "Duration",
        iso: options.startedAt,
      };
    }
    return { label: "Waiting", iso: null as string | null };
  }, [options.answeredAt, options.startedAt, options.status]);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!anchor.iso || options.endedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [anchor.iso, options.endedAt]);

  const elapsedSeconds = useMemo(() => {
    if (!anchor.iso) return 0;
    const endMs = options.endedAt ? new Date(options.endedAt).getTime() : now;
    const startMs = new Date(anchor.iso).getTime();
    return Math.max(0, Math.floor((endMs - startMs) / 1000));
  }, [anchor.iso, now, options.endedAt]);

  return {
    label: anchor.label,
    elapsedSeconds,
    formatted: formatElapsed(elapsedSeconds),
    isLive: Boolean(anchor.iso && !options.endedAt),
  };
}
