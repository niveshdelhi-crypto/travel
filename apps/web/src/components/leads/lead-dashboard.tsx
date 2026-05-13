"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAddLeadNoteMutation,
  useLeadMetricsQuery,
  useLeadRealtimeInvalidation,
  useLeadsQuery,
  useRecordCallMutation,
  useUpdateLeadMutation,
} from "@/hooks/api/use-leads-api";
import { useLeadUiStore } from "@/lib/leads/store";
import type { Lead, LeadStatus, PaginatedLeads } from "@/lib/leads/types";

const statuses: LeadStatus[] = ["NEW", "CONTACTED", "NEGOTIATING", "CONFIRMED", "COMPLETED"];

const statusLabel: Record<LeadStatus | "ALL", string> = {
  ALL: "All",
  NEW: "New",
  CONTACTED: "Contacted",
  NEGOTIATING: "Negotiating",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
};

export function LeadDashboard({
  mode,
  initialLeads,
}: {
  mode: "sales" | "admin";
  initialLeads: PaginatedLeads;
}) {
  const { selectedLeadId, page, pageSize, status, setSelectedLeadId, setPage, setStatus } =
    useLeadUiStore();
  const leadsQuery = useLeadsQuery(
    { page, pageSize, status },
    page === 1 && status === "ALL" ? initialLeads : undefined,
  );
  const metricsQuery = useLeadMetricsQuery();
  const updateLead = useUpdateLeadMutation();
  const recordCall = useRecordCallMutation();
  const addNote = useAddLeadNoteMutation();

  useLeadRealtimeInvalidation(mode === "admin");

  const leadPage = leadsQuery.data ?? initialLeads;
  const leads = leadPage.data;
  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? leads[0] ?? null,
    [leads, selectedLeadId],
  );

  useEffect(() => {
    if (!selectedLeadId && leads[0]) setSelectedLeadId(leads[0].id);
  }, [leads, selectedLeadId, setSelectedLeadId]);

  const mutationError =
    updateLead.error?.message ?? recordCall.error?.message ?? addNote.error?.message ?? null;

  return (
    <main className="min-h-screen bg-[#f5f7fa] px-5 py-5 text-[#172033]">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d7dde8] pb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {mode === "admin" ? "Leads" : "My leads"}
            </h1>
            <p className="mt-1 text-sm text-[#637083]">
              {leadPage.total} records - realtime sync{" "}
              {leadsQuery.isFetching ? "updating" : "ready"}
            </p>
          </div>
          <button
            onClick={() => void leadsQuery.refetch()}
            className="h-9 rounded-md border border-[#cbd3df] bg-white px-3 text-sm font-medium shadow-sm"
          >
            Refresh
          </button>
        </header>

        <section className="mt-4 grid gap-3 md:grid-cols-4">
          <Metric
            label="Open"
            value={metricCount(metricsQuery.data, ["NEW", "CONTACTED", "NEGOTIATING", "CONFIRMED"])}
          />
          <Metric label="New" value={metricsQuery.data?.statusCounts.NEW ?? "..."} />
          <Metric label="Confirmed" value={metricsQuery.data?.statusCounts.CONFIRMED ?? "..."} />
          <Metric label="Revenue" value={currency(metricsQuery.data?.revenue ?? 0)} />
        </section>

        {mode === "admin" && metricsQuery.data ? (
          <section className="mt-3 border-y border-[#d7dde8] bg-white px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold uppercase text-[#637083]">
                Assignment load
              </span>
              {metricsQuery.data.activeAgents.map((agent) => (
                <span key={agent.id} className="text-sm text-[#2d3a4f]">
                  {agent.name}: <strong>{agent.current_lead_count}</strong>
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="border border-[#d7dde8] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d7dde8] px-3 py-2">
              <div className="flex flex-wrap gap-1">
                {(["ALL", ...statuses] as Array<LeadStatus | "ALL">).map((item) => (
                  <button
                    key={item}
                    onClick={() => setStatus(item)}
                    className={`h-8 rounded-md px-3 text-sm font-medium ${
                      status === item ? "bg-[#172033] text-white" : "bg-[#eef2f7] text-[#36445a]"
                    }`}
                  >
                    {statusLabel[item]}
                  </button>
                ))}
              </div>
              <span className="text-sm text-[#637083]">
                Page {leadPage.page} of {leadPage.totalPages}
              </span>
            </div>

            {leadsQuery.isError ? (
              <StateMessage title="Unable to load leads" body={leadsQuery.error.message} />
            ) : leadsQuery.isLoading ? (
              <StateMessage title="Loading leads" body="Fetching the current sales queue." />
            ) : leads.length === 0 ? (
              <StateMessage
                title="No leads found"
                body="Change the filter or wait for new assignments."
              />
            ) : (
              <LeadTable
                mode={mode}
                leads={leads}
                selectedLeadId={selectedLead?.id ?? null}
                onSelect={setSelectedLeadId}
              />
            )}

            <Pagination
              page={leadPage.page}
              totalPages={leadPage.totalPages}
              onPage={setPage}
              disabled={leadsQuery.isFetching}
            />
          </div>

          {selectedLead ? (
            <LeadDetail
              lead={selectedLead}
              error={mutationError}
              isSaving={updateLead.isPending || recordCall.isPending || addNote.isPending}
              onStatus={(nextStatus) =>
                updateLead.mutate({ id: selectedLead.id, input: { status: nextStatus } })
              }
              onValue={(bookingValue) =>
                updateLead.mutate({ id: selectedLead.id, input: { booking_value: bookingValue } })
              }
              onCall={() => recordCall.mutate(selectedLead)}
              onNote={(body) => addNote.mutate({ lead: selectedLead, body })}
            />
          ) : (
            <aside className="border border-[#d7dde8] bg-white p-5 text-sm text-[#637083]">
              Select a lead to work it.
            </aside>
          )}
        </section>
      </div>
    </main>
  );
}

function LeadTable({
  mode,
  leads,
  selectedLeadId,
  onSelect,
}: {
  mode: "sales" | "admin";
  leads: Lead[];
  selectedLeadId: string | null;
  onSelect: (leadId: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed text-left text-sm">
        <thead className="border-b border-[#d7dde8] bg-[#f8fafc] text-xs uppercase text-[#637083]">
          <tr>
            <th className="w-[28%] px-3 py-2 font-semibold">Contact</th>
            <th className="w-[28%] px-3 py-2 font-semibold">Trip</th>
            <th className="w-[14%] px-3 py-2 font-semibold">Status</th>
            <th className="w-[15%] px-3 py-2 font-semibold">
              {mode === "admin" ? "Owner" : "Value"}
            </th>
            <th className="w-[15%] px-3 py-2 font-semibold">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf1f6]">
          {leads.map((lead) => (
            <tr
              key={lead.id}
              onClick={() => onSelect(lead.id)}
              className={`cursor-pointer hover:bg-[#f5f8fc] ${
                selectedLeadId === lead.id ? "bg-[#edf4ff]" : ""
              }`}
            >
              <td className="px-3 py-3">
                <span className="block font-semibold text-[#172033]">{lead.customer_name}</span>
                <span className="block truncate text-xs text-[#637083]">{lead.customer_email}</span>
              </td>
              <td className="px-3 py-3">
                <span className="block truncate">{lead.pickup_location}</span>
                <span className="block truncate text-xs text-[#637083]">{lead.drop_location}</span>
              </td>
              <td className="px-3 py-3">
                <StatusPill status={lead.status} />
              </td>
              <td className="truncate px-3 py-3 text-[#36445a]">
                {mode === "admin"
                  ? (lead.assigned_agent?.name ?? "Unassigned")
                  : currency(Number(lead.booking_value ?? 0))}
              </td>
              <td className="px-3 py-3 text-[#637083]">{formatShortDate(lead.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeadDetail({
  lead,
  error,
  isSaving,
  onStatus,
  onValue,
  onCall,
  onNote,
}: {
  lead: Lead;
  error: string | null;
  isSaving: boolean;
  onStatus: (status: LeadStatus) => void;
  onValue: (value: number) => void;
  onCall: () => void;
  onNote: (body: string) => void;
}) {
  const [note, setNote] = useState("");
  const [value, setValue] = useState(String(lead.booking_value ?? ""));

  useEffect(() => setValue(String(lead.booking_value ?? "")), [lead.booking_value, lead.id]);

  return (
    <aside className="border border-[#d7dde8] bg-white">
      <div className="border-b border-[#d7dde8] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{lead.customer_name}</h2>
            <p className="mt-1 truncate text-sm text-[#637083]">{lead.customer_email}</p>
            <p className="text-sm text-[#637083]">{lead.customer_phone}</p>
          </div>
          <StatusPill status={lead.status} />
        </div>
        {error ? (
          <p className="mt-3 rounded-md bg-[#fff1f0] px-3 py-2 text-sm text-[#b42318]">{error}</p>
        ) : null}
      </div>

      <div className="space-y-4 p-4">
        <div className="grid gap-2 text-sm">
          <Info
            label="Pickup"
            value={`${lead.pickup_location} - ${formatDate(lead.pickup_datetime)}`}
          />
          <Info
            label="Return"
            value={`${lead.drop_location} - ${formatDate(lead.return_datetime)}`}
          />
          <Info label="Owner" value={lead.assigned_agent?.name ?? "Unassigned"} />
        </div>

        <label className="block text-sm font-semibold">
          Status
          <select
            value={lead.status}
            disabled={isSaving}
            onChange={(event) => onStatus(event.target.value as LeadStatus)}
            className="mt-1 h-9 w-full rounded-md border border-[#cbd3df] bg-white px-2"
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {statusLabel[item]}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold">
          Booking value
          <input
            value={value}
            inputMode="decimal"
            disabled={isSaving}
            onChange={(event) => setValue(event.target.value)}
            onBlur={() => onValue(Number(value || 0))}
            className="mt-1 h-9 w-full rounded-md border border-[#cbd3df] px-2"
          />
        </label>

        <button
          disabled={isSaving}
          onClick={onCall}
          className="h-9 w-full rounded-md bg-[#172033] px-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          Log call
        </button>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!note.trim()) return;
            onNote(note.trim());
            setNote("");
          }}
        >
          <label className="block text-sm font-semibold">
            Note
            <textarea
              value={note}
              disabled={isSaving}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-[#cbd3df] p-2"
            />
          </label>
          <button
            disabled={isSaving || !note.trim()}
            className="mt-2 h-9 rounded-md border border-[#cbd3df] px-3 text-sm font-semibold disabled:opacity-60"
          >
            Add note
          </button>
        </form>

        <div className="space-y-2">
          {lead.notes.length ? (
            lead.notes.map((item) => (
              <div key={item.id} className="border-l-2 border-[#cbd3df] bg-[#f8fafc] px-3 py-2">
                <p className="text-sm">{item.body}</p>
                <p className="mt-1 text-xs text-[#637083]">
                  {item.author.name} - {formatShortDate(item.created_at)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-[#637083]">No notes yet.</p>
          )}
        </div>
      </div>
    </aside>
  );
}

function Pagination({
  page,
  totalPages,
  disabled,
  onPage,
}: {
  page: number;
  totalPages: number;
  disabled: boolean;
  onPage: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-[#d7dde8] px-3 py-2">
      <button
        disabled={disabled || page <= 1}
        onClick={() => onPage(page - 1)}
        className="h-8 rounded-md border border-[#cbd3df] px-3 text-sm font-medium disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-sm text-[#637083]">
        {page} / {totalPages}
      </span>
      <button
        disabled={disabled || page >= totalPages}
        onClick={() => onPage(page + 1)}
        className="h-8 rounded-md border border-[#cbd3df] px-3 text-sm font-medium disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-[#d7dde8] bg-white p-3">
      <p className="text-xs font-semibold uppercase text-[#637083]">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-[#637083]">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}

function StateMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="p-8 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-[#637083]">{body}</p>
    </div>
  );
}

function StatusPill({ status }: { status: LeadStatus }) {
  return (
    <span className="inline-flex rounded-md bg-[#e9eef5] px-2 py-1 text-xs font-semibold text-[#36445a]">
      {statusLabel[status]}
    </span>
  );
}

function metricCount(metrics: ReturnType<typeof useLeadMetricsQuery>["data"], keys: LeadStatus[]) {
  if (!metrics) return "…";
  return keys.reduce((sum, key) => sum + (metrics.statusCounts[key] ?? 0), 0);
}

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
