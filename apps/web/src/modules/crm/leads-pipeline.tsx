"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, Filter, Plus, Search, Trash2 } from "lucide-react";
import { CrmModal } from "@/components/crm/crm-modal";
import { Avatar, Badge, EmptyState } from "@/components/crm/primitives";
import type { BadgeTone } from "@/components/crm/primitives";
import { useAuth } from "@/components/auth/auth-provider";
import { useLeadRealtimeInvalidation } from "@/hooks/api/use-leads-api";
import type { CloseLeadBookingPayload } from "@/lib/bookings/close-lead";
import { crmQueryKeys } from "@/lib/crm/query-keys";
import type { Lead, LeadStatus, PaginatedLeads } from "@/lib/leads/types";
import { bookingsService } from "@/services/bookings.service";
import { leadsService } from "@/services/leads.service";

const stages: Array<{ key: LeadStatus; label: string; color: string }> = [
  { key: "NEW", label: "New", color: "bg-slate-400" },
  { key: "CONTACTED", label: "Contacted", color: "bg-sky-500" },
  { key: "NEGOTIATING", label: "Negotiating", color: "bg-amber-500" },
  { key: "CONFIRMED", label: "Confirmed", color: "bg-emerald-500" },
  { key: "COMPLETED", label: "Completed", color: "bg-[#172033]" },
];

export function LeadsPipeline({ initialLeads, scope }: { initialLeads: PaginatedLeads; scope: "admin" | "my" }) {
  const { hasRole } = useAuth();
  const isAdmin = hasRole(["admin"]);
  const listQueryKey = crmQueryKeys.pipeline(scope);

  const leadsQuery = useQuery({
    queryKey: listQueryKey,
    queryFn: () =>
      scope === "admin"
        ? leadsService.listAdminLeads({ page: 1, pageSize: 100 })
        : leadsService.listMyLeads({ page: 1, pageSize: 100 }),
    initialData: initialLeads,
  });

  useLeadRealtimeInvalidation(isAdmin);

  const grouped = groupLeads(leadsQuery.data?.data ?? []);

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-[#f5f7fa] text-[#172033]">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#d7dde8] bg-white px-5 py-3">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#637083]" />
          <input
            placeholder="Filter pipeline…"
            className="h-10 min-w-[200px] rounded-lg border border-[#d7dde8] bg-white px-3 py-2 pl-9 text-sm sm:w-72"
            disabled
          />
        </div>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#d7dde8] px-3 py-2 text-xs opacity-70"
        >
          <Filter className="h-3.5 w-3.5" /> Server filters pending
        </button>
        <div className="ml-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#172033] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Capture lead
          </Link>
        </div>
      </div>

      {leadsQuery.isLoading ? (
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-xl border border-[#d7dde8] bg-white" />
          ))}
        </div>
      ) : leadsQuery.isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Unable to load leads"
          description="The authenticated leads API did not respond successfully."
        />
      ) : (
        <div className="flex-1 overflow-x-auto">
          <div className="flex h-full min-w-max gap-3 p-4">
            {stages.map((stage) => {
              const columnLeads = grouped[stage.key] ?? [];
              return (
                <div
                  key={stage.key}
                  className="flex w-[300px] shrink-0 flex-col rounded-xl border border-[#d7dde8] bg-white/80"
                >
                  <div className="flex items-center justify-between border-b border-[#d7dde8] px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${stage.color}`} />
                      <span className="text-sm font-semibold">{stage.label}</span>
                      <span className="rounded bg-[#eef2f7] px-1.5 py-0.5 text-[10px] text-[#637083]">
                        {columnLeads.length}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto p-2">
                    {columnLeads.length ? (
                      columnLeads.map((lead) => (
                        <LeadCard key={lead.id} lead={lead} listQueryKey={listQueryKey} />
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-[#d7dde8] p-4 text-center text-xs text-[#637083]">
                        No leads in this stage.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}

function LeadCard({
  lead,
  listQueryKey,
}: {
  lead: Lead;
  listQueryKey: ReturnType<typeof crmQueryKeys.pipeline>;
}) {
  const queryClient = useQueryClient();
  const nextStatus = getNextStatus(lead.status);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [grossInput, setGrossInput] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [partner, setPartner] = useState("");
  const [confirmationRef, setConfirmationRef] = useState("");
  const [notes, setNotes] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingOpen) return;
    setGrossInput("");
    setCurrency("USD");
    setPartner("");
    setConfirmationRef("");
    setNotes("");
    setLocalError(null);
  }, [bookingOpen]);

  const updateMutation = useMutation({
    mutationFn: (status: LeadStatus) => leadsService.updateLeadStatus(lead.id, status),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: listQueryKey });
      const previous = queryClient.getQueryData<PaginatedLeads>(listQueryKey);
      queryClient.setQueryData<PaginatedLeads>(listQueryKey, (old) =>
        old
          ? { ...old, data: old.data.map((row) => (row.id === lead.id ? { ...row, status: next } : row)) }
          : old,
      );
      return { previous };
    },
    onError: (_err, _next, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(listQueryKey, ctx.previous);
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const closeBookingMutation = useMutation({
    mutationFn: (payload: CloseLeadBookingPayload) => bookingsService.closeLead(payload),
    onSuccess: () => setBookingOpen(false),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => leadsService.deleteLead(lead.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: listQueryKey });
      const previous = queryClient.getQueryData<PaginatedLeads>(listQueryKey);
      queryClient.setQueryData<PaginatedLeads>(listQueryKey, (old) =>
        old
          ? {
              ...old,
              data: old.data.filter((row) => row.id !== lead.id),
              total: Math.max(0, old.total - 1),
            }
          : old,
      );
      return { previous };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(listQueryKey, ctx.previous);
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const followUpMutation = useMutation({
    mutationFn: () => {
      const when = new Date();
      when.setDate(when.getDate() + 2);
      when.setHours(9, 0, 0, 0);
      return leadsService.patchLead(lead.id, { follow_up_at: when.toISOString() });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: listQueryKey });
      const previous = queryClient.getQueryData<PaginatedLeads>(listQueryKey);
      const iso = new Date(Date.now() + 2 * 86400000).toISOString();
      queryClient.setQueryData<PaginatedLeads>(listQueryKey, (old) =>
        old
          ? {
              ...old,
              data: old.data.map((row) =>
                row.id === lead.id ? { ...row, follow_up_at: iso } : row,
              ),
            }
          : old,
      );
      return { previous };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(listQueryKey, ctx.previous);
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const pending =
    updateMutation.isPending ||
    deleteMutation.isPending ||
    followUpMutation.isPending ||
    closeBookingMutation.isPending;

  const followUpScheduled =
    lead.follow_up_at && !Number.isNaN(Date.parse(lead.follow_up_at))
      ? new Date(lead.follow_up_at) > new Date()
      : false;

  function submitBookingClose(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    const gross = Number.parseFloat(grossInput);
    if (!Number.isFinite(gross) || gross < 0) {
      setLocalError("Enter a valid gross corridor revenue.");
      return;
    }
    const payload: CloseLeadBookingPayload = {
      lead_id: lead.id,
      gross_revenue: gross,
      currency: currency.trim().toUpperCase().slice(0, 3) || "USD",
    };
    const pn = partner.trim();
    const cr = confirmationRef.trim();
    const nt = notes.trim();
    if (pn) payload.partner_name = pn;
    if (cr) payload.confirmation_reference = cr;
    if (nt) payload.notes = nt;
    closeBookingMutation.mutate(payload);
  }

  function advanceStage() {
    if (!nextStatus) return;
    if (lead.status === "CONFIRMED" && nextStatus === "COMPLETED") {
      setBookingOpen(true);
      return;
    }
    updateMutation.mutate(nextStatus);
  }

  const bookingErr =
    localError ||
    (closeBookingMutation.error instanceof Error ? closeBookingMutation.error.message : null);

  return (
    <>
      <div className="rounded-lg border border-[#d7dde8] bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar name={lead.customer_name} />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{lead.customer_name}</div>
              <div className="text-[11px] text-[#637083]">{lead.id.slice(0, 8)}</div>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge tone={statusTone(lead.status)}>{statusLabel(lead.status)}</Badge>
            {followUpScheduled ? (
              <span className="text-[10px] font-medium text-amber-700">
                Follow-up {new Date(lead.follow_up_at as string).toLocaleDateString()}
              </span>
            ) : null}
          </div>
        </div>
        <div className="mt-3 space-y-1 text-xs text-[#637083]">
          <div className="line-clamp-2 text-[#36445a]">
            {lead.pickup_location} → {lead.drop_location}
          </div>
          <div>{formatDateRange(lead.pickup_datetime, lead.return_datetime)}</div>
          <div className="truncate">{lead.customer_phone}</div>
        </div>
        <div className="mt-3 border-t border-[#eef2f7] pt-2 text-xs text-[#637083]">
          {lead.assigned_agent?.name ?? "Unassigned"}
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {nextStatus ? (
            <button
              type="button"
              onClick={advanceStage}
              disabled={pending}
              className="w-full rounded-lg border border-[#d7dde8] bg-[#f8fafc] px-3 py-2 text-[11px] font-medium hover:bg-[#eef2f7] disabled:opacity-50"
            >
              {lead.status === "CONFIRMED" && nextStatus === "COMPLETED"
                ? "Close as booked"
                : `Mark ${statusLabel(nextStatus)}`}
            </button>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => followUpMutation.mutate()}
              disabled={pending}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-2 text-[10px] font-semibold text-amber-900 disabled:opacity-50"
            >
              <CalendarClock className="h-3.5 w-3.5" />
              Follow-up
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Remove this lead from the pipeline? This cannot be undone.")) {
                  deleteMutation.mutate();
                }
              }}
              disabled={pending}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-[10px] font-semibold text-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <CrmModal
        open={bookingOpen}
        onClose={() => {
          setBookingOpen(false);
          closeBookingMutation.reset();
        }}
        title="Record booking & complete"
        description={`${lead.customer_name} · ${lead.pickup_location} → ${lead.drop_location}`}
      >
        <form onSubmit={submitBookingClose} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="font-medium">Gross revenue</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={grossInput}
                onChange={(ev) => setGrossInput(ev.target.value)}
                required
                className="mt-1 h-10 w-full rounded-lg border border-[#d7dde8] px-3 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Currency</span>
              <input
                type="text"
                maxLength={3}
                value={currency}
                onChange={(ev) => setCurrency(ev.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-[#d7dde8] px-3 text-sm uppercase"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="font-medium">Partner (optional)</span>
            <input
              type="text"
              value={partner}
              onChange={(ev) => setPartner(ev.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-[#d7dde8] px-3 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Confirmation ref (optional)</span>
            <input
              type="text"
              value={confirmationRef}
              onChange={(ev) => setConfirmationRef(ev.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-[#d7dde8] px-3 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Notes (optional)</span>
            <textarea
              rows={3}
              value={notes}
              onChange={(ev) => setNotes(ev.target.value)}
              className="mt-1 w-full rounded-lg border border-[#d7dde8] px-3 py-2 text-sm"
            />
          </label>
          {bookingErr ? <p className="text-sm font-medium text-red-600">{bookingErr}</p> : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setBookingOpen(false)}
              className="rounded-lg border border-[#d7dde8] px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-[#172033] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Save & complete lead
            </button>
          </div>
        </form>
      </CrmModal>
    </>
  );
}

function groupLeads(leads: Lead[]) {
  return leads.reduce(
    (acc, lead) => {
      acc[lead.status] = [...(acc[lead.status] ?? []), lead];
      return acc;
    },
    {} as Record<LeadStatus, Lead[]>,
  );
}

function getNextStatus(status: LeadStatus): LeadStatus | null {
  const index = stages.findIndex((stage) => stage.key === status);
  return index >= 0 ? (stages[index + 1]?.key ?? null) : null;
}

function statusTone(status: LeadStatus): BadgeTone {
  if (status === "CONFIRMED" || status === "COMPLETED") return "success";
  if (status === "NEGOTIATING") return "warning";
  if (status === "CONTACTED") return "info";
  return "neutral";
}

function statusLabel(status: LeadStatus) {
  return status.toLowerCase().replace(/^\w/, (char) => char.toUpperCase());
}

function formatDateRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}
