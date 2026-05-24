import { motion } from "framer-motion";
import { useCallTimer } from "@/hooks/use-call-timer";
import type { CallStatus } from "@/types/calls";

export function CallTimer({
  status,
  startedAt,
  answeredAt,
  endedAt,
  size = "md",
}: {
  status: CallStatus;
  startedAt: string | null;
  answeredAt: string | null;
  endedAt: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const timer = useCallTimer({ status, startedAt, answeredAt, endedAt });
  const sizeClass = size === "lg" ? "text-4xl" : size === "sm" ? "text-sm" : "text-2xl";

  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        {timer.label}
      </span>
      <motion.span
        key={timer.formatted}
        initial={{ opacity: 0.6, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`font-mono font-semibold tabular-nums text-white ${sizeClass}`}
      >
        {timer.formatted}
      </motion.span>
    </div>
  );
}
