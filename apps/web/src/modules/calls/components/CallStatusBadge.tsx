"use client";

import { motion } from "framer-motion";
import type { CallStatus } from "@/lib/calls/types";

const STATUS_STYLES: Record<CallStatus, { label: string; className: string; pulse?: boolean }> = {
  INITIATED: { label: "Initiated", className: "bg-slate-500/20 text-slate-200" },
  RINGING: {
    label: "Ringing",
    className: "bg-amber-500/20 text-amber-200",
    pulse: true,
  },
  ANSWERED: { label: "Live", className: "bg-emerald-500/20 text-emerald-200", pulse: true },
  COMPLETED: { label: "Completed", className: "bg-slate-500/20 text-slate-300" },
  FAILED: { label: "Failed", className: "bg-rose-500/20 text-rose-200" },
  BUSY: { label: "Busy", className: "bg-orange-500/20 text-orange-200" },
  NO_ANSWER: { label: "No answer", className: "bg-slate-500/20 text-slate-300" },
  CANCELLED: { label: "Cancelled", className: "bg-slate-500/20 text-slate-300" },
};

export function CallStatusBadge({ status }: { status: CallStatus }) {
  const config = STATUS_STYLES[status];

  return (
    <motion.span
      layout
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${config.className}`}
    >
      {config.pulse ? (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      ) : null}
      {config.label}
    </motion.span>
  );
}
