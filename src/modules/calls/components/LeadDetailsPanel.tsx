import { motion } from "framer-motion";
import { Loader2, StickyNote } from "lucide-react";
import { useState, type FormEvent } from "react";
import { formatPhoneDisplay } from "@/lib/phone";
import type { BackendLead } from "@/services";

export function LeadDetailsPanel({
  lead,
  isLoading,
  onAddNote,
  isSavingNote,
  noteError,
}: {
  lead: BackendLead | null;
  isLoading: boolean;
  onAddNote: (body: string) => Promise<void>;
  isSavingNote: boolean;
  noteError: string | null;
}) {
  const [noteBody, setNoteBody] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = noteBody.trim();
    if (!trimmed) return;
    await onAddNote(trimmed);
    setNoteBody("");
  }

  return (
    <aside className="flex h-full min-h-0 flex-col border-border bg-surface/80 lg:border-l">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Lead details
        </h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !lead ? (
          <p className="text-sm text-muted-foreground">Select a lead to view context.</p>
        ) : (
          <motion.div
            key={lead.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <h3 className="text-lg font-semibold text-foreground">{lead.customer_name}</h3>
              <p className="text-sm text-muted-foreground">{lead.customer_email}</p>
              <a
                href={`tel:${lead.customer_phone}`}
                className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
              >
                {formatPhoneDisplay(lead.customer_phone)}
              </a>
              {lead.is_high_quality ? (
                <p className="mt-1 text-xs font-semibold text-amber-400">
                  High quality
                  {lead.retain_until
                    ? ` · retain until ${new Date(lead.retain_until).toLocaleDateString()}`
                    : ""}
                </p>
              ) : null}
            </div>

            <dl className="grid gap-2 text-sm">
              <Detail label="Status" value={lead.status} />
              <Detail label="Pickup" value={lead.pickup_location} />
              <Detail label="Drop-off" value={lead.drop_location} />
              <Detail
                label="Trip"
                value={`${formatDate(lead.pickup_datetime)} → ${formatDate(lead.return_datetime)}`}
              />
              {lead.assigned_agent ? (
                <Detail label="Agent" value={lead.assigned_agent.name} />
              ) : null}
            </dl>

            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <StickyNote className="h-3.5 w-3.5" />
                Call notes
              </label>
              <textarea
                value={noteBody}
                onChange={(event) => setNoteBody(event.target.value)}
                rows={4}
                placeholder="Log conversation notes during the call..."
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
              />
              {noteError ? <p className="text-xs text-destructive">{noteError}</p> : null}
              <button
                type="submit"
                disabled={isSavingNote || !noteBody.trim()}
                className="h-10 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {isSavingNote ? "Saving..." : "Save note"}
              </button>
            </form>

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Recent notes
              </h4>
              <ul className="space-y-2">
                {!lead.notes?.length ? (
                  <li className="text-sm text-muted-foreground">No notes yet.</li>
                ) : (
                  lead.notes.map((note) => (
                    <li key={note.id} className="rounded-lg border border-border bg-surface-2 p-3">
                      <p className="text-sm text-foreground">{note.body}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {note.author?.name ?? "Agent"} · {formatDate(note.created_at)}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </motion.div>
        )}
      </div>
    </aside>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-foreground">{value}</dd>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
