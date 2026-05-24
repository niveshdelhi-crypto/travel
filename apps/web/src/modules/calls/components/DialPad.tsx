"use client";

import { motion } from "framer-motion";
import { Delete } from "lucide-react";

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

export function DialPad({
  value,
  onDigit,
  onBackspace,
  disabled = false,
}: {
  value: string;
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-3 text-center font-mono text-lg tracking-widest text-white">
        {value || "Enter number"}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {KEYS.flat().map((key) => (
          <motion.button
            key={key}
            type="button"
            whileTap={{ scale: 0.94 }}
            disabled={disabled}
            onClick={() => onDigit(key)}
            className="h-12 rounded-xl border border-slate-700/60 bg-slate-800/80 text-lg font-semibold text-white transition hover:border-slate-500 hover:bg-slate-700 disabled:opacity-40"
          >
            {key}
          </motion.button>
        ))}
      </div>
      <button
        type="button"
        disabled={disabled || !value}
        onClick={onBackspace}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-700/60 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
      >
        <Delete className="h-4 w-4" />
        Backspace
      </button>
    </div>
  );
}
