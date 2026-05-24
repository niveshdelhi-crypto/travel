"use client";

import { motion } from "framer-motion";
import { PhoneIncoming, PhoneOutgoing } from "lucide-react";
import { CallStatusBadge } from "./CallStatusBadge";
import { CallTimer } from "./CallTimer";
import type { LiveCallSession } from "@/lib/calls/types";

export function ActiveCallCard({
  call,
  leadName,
  agentName,
  selected,
  onSelect,
}: {
  call: LiveCallSession;
  leadName?: string;
  agentName?: string;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const displayNumber = call.direction === "OUTBOUND" ? call.to_number : call.from_number;

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      onClick={onSelect}
      className={`w-full rounded-xl border p-3 text-left transition ${
        selected
          ? "border-sky-500/60 bg-sky-500/10 shadow-[0_0_0_1px_rgba(56,189,248,0.25)]"
          : "border-slate-700/60 bg-slate-900/40 hover:border-slate-600"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {call.direction === "OUTBOUND" ? (
            <PhoneOutgoing className="h-4 w-4 text-sky-400" />
          ) : (
            <PhoneIncoming className="h-4 w-4 text-emerald-400" />
          )}
          <div>
            <p className="text-sm font-semibold text-white">{leadName ?? displayNumber}</p>
            <p className="text-xs text-slate-400">{displayNumber}</p>
          </div>
        </div>
        <CallStatusBadge status={call.status} />
      </div>
      <div className="mt-3 flex items-end justify-between">
        <CallTimer
          status={call.status}
          startedAt={call.started_at}
          answeredAt={call.answered_at}
          endedAt={call.ended_at}
          size="sm"
        />
        {agentName ? (
          <span className="text-[10px] uppercase tracking-wide text-slate-500">{agentName}</span>
        ) : null}
      </div>
      {(call.isMuted || call.isOnHold) && (
        <div className="mt-2 flex gap-1">
          {call.isMuted ? (
            <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">
              Muted
            </span>
          ) : null}
          {call.isOnHold ? (
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-200">
              On hold
            </span>
          ) : null}
        </div>
      )}
    </motion.button>
  );
}
