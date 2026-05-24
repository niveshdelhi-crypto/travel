import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { formatPhoneDisplay } from "@/lib/phone";
import type { BackendLead, BackendLeadStatus } from "@/services";

const QUEUE_STATUSES: BackendLeadStatus[] = ["NEW", "CONTACTED", "NEGOTIATING"];

export function LeadQueueSidebar({
  leads,
  isLoading,
  error,
  selectedLeadId,
  onSelectLead,
  className = "",
}: {
  leads: BackendLead[];
  isLoading: boolean;
  error: string | null;
  selectedLeadId: string | null;
  onSelectLead: (leadId: string) => void;
  className?: string;
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
    <aside
      className={`flex h-full min-h-0 flex-col border-border bg-surface/80 lg:border-r ${className}`}
    >
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Lead queue
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{filtered.length} callable leads</p>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search leads..."
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-lg bg-surface-2" />
            ))}
          </div>
        ) : error ? (
          <p className="p-4 text-sm text-destructive">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No leads in queue.</p>
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
                    ? "border-primary/50 bg-primary/10"
                    : "border-transparent bg-surface-2/50 hover:border-border hover:bg-surface-2"
                }`}
              >
                <p className="text-sm font-medium text-foreground">{lead.customer_name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatPhoneDisplay(lead.customer_phone)}
                </p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
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
