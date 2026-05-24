import type { AgentPresence } from "@/types/calls";

const PRESENCE_CONFIG: Record<AgentPresence, { label: string; dot: string; ring: string }> = {
  available: { label: "Available", dot: "bg-emerald-400", ring: "ring-emerald-400/30" },
  busy: { label: "Busy", dot: "bg-amber-400", ring: "ring-amber-400/30" },
  on_call: { label: "On call", dot: "bg-sky-400", ring: "ring-sky-400/30" },
  offline: { label: "Offline", dot: "bg-slate-500", ring: "ring-slate-500/30" },
};

export function AgentPresenceIndicator({
  presence,
  onChange,
}: {
  presence: AgentPresence;
  onChange?: (presence: AgentPresence) => void;
}) {
  if (!onChange) {
    const config = PRESENCE_CONFIG[presence];
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-slate-200 ring-1 ${config.ring} bg-slate-800/80`}
      >
        <span className={`h-2 w-2 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {(Object.keys(PRESENCE_CONFIG) as AgentPresence[]).map((item) => {
        const itemConfig = PRESENCE_CONFIG[item];
        const active = item === presence;
        return (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${
              active
                ? `bg-slate-700 text-white ring-1 ${itemConfig.ring}`
                : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${itemConfig.dot}`} />
            {itemConfig.label}
          </button>
        );
      })}
    </div>
  );
}
