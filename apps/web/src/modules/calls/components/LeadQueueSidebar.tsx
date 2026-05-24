"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Lead, LeadStatus } from "@/lib/leads/types";

const QUEUE_STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "NEGOTIATING"];

export function LeadQueueSidebar({
  leads,
  isLoading,
  error,
  selectedLeadId,
  onSelectLead,
}: {
  leads: Lead[];
  isLoading: boolean;
  error: string | null;
  selectedLeadId: string | null;
  onSelectLead: (leadId: string) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const queue = leads.filter((lead) => QUEUE_STATUSES.includes(lead.status));
    const normalized = query.trim().toLowerCase();
    if (!normalized) return queue;
    return queue.filter(
      (lead) =>
        lead.customer_name.toLowerCase().includes(normalized) ||
        lead.customer_phone.includes(normalized) ||
        lead.customer_email.toLowerCase().includes(normalized),
    );
  }, [leads, query]);

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-slate-800/80 bg-slate-950/60">
      <div className="border-b border-slate-800/80 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          Lead queue
        </h2>
        <p className="mt-1 text-xs text-slate-500">{filtered.length} callable leads</p>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search leads..."
            className="h-10 w-full rounded-lg border border-slate-700/80 bg-slate-900/80 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-lg bg-slate-800/60" />
            ))}
          </div>
        ) : error ? (
          <p className="p-4 text-sm text-rose-300">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No leads in queue.</p>
        ) : (
          <AnimatePresence initial={false}>
            {filtered.map((lead) => (
              <motion.button
                key={lead.id}
                layout
                type="button"
                onClick={() => onSelectLead(lead.id)}
                className={`mb-2 w-full rounded-lg border p-3 text-left transition ${
                  selectedLeadId === lead.id
                    ? "border-sky-500/50 bg-sky-500/10"
                    : "border-transparent bg-slate-900/30 hover:border-slate-700/80 hover:bg-slate-900/60"
                }`}
              >
                <p className="text-sm font-medium text-white">{lead.customer_name}</p>
                <p className="mt-0.5 text-xs text-slate-400">{lead.customer_phone}</p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {lead.status}
                </p>
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>
    </aside>
  );
}
