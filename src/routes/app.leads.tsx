import { createFileRoute, Link } from "@tanstack/react-router";
import { requireAdminRoute } from "@/lib/route-guards";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/app-shell";
import { Avatar, Badge, EmptyState, SkeletonCard } from "@/components/app/primitives";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  CalendarClock,
  Filter,
  Plus,
  Search,
  Star,
  Trash2,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { formatPhoneDisplay } from "@/lib/phone";
import { bookingOrchestrationService } from "@/services/booking-orchestration.service";
import { paymentQueryKeys } from "@/lib/payments/query-keys";
import {
  leadsService,
  type BackendLead,
  type BackendLeadStatus,
  type BackendPaginatedResponse,
} from "@/services";
import { useAuthStore } from "@/store/auth.store";
import type { BadgeTone } from "@/types";

export const Route = createFileRoute("/app/leads")({
  beforeLoad: requireAdminRoute,
  component: LeadsPage,
});

const stages: Array<{ key: BackendLeadStatus; label: string; color: string }> = [
  { key: "NEW", label: "New", color: "bg-muted-foreground" },
  { key: "CONTACTED", label: "Contacted", color: "bg-secondary" },
  { key: "NEGOTIATING", label: "Negotiating", color: "bg-warning" },
  { key: "CONFIRMED", label: "Confirmed", color: "bg-success" },
  { key: "COMPLETED", label: "Completed", color: "bg-primary" },
];

type LeadsQueryKey = readonly ["leads", "admin" | "my", { page: number; pageSize: number }];

function LeadsPage() {
  return (
    <AppShell title="Leads">
      <LeadsPipelineView scope="admin" />
    </AppShell>
  );
}

export function LeadsPipelineView({ scope }: { scope: "admin" | "my" }) {
  const user = useAuthStore((state) => state.user);
  const listQueryKey = ["leads", scope, { page: 1, pageSize: 100 }] as const satisfies LeadsQueryKey;

  const leadsQuery = useQuery({
    queryKey: listQueryKey,
    queryFn: () =>
      scope === "admin"
        ? leadsService.admin({ page: 1, pageSize: 100 })
        : leadsService.my({ page: 1, pageSize: 100 }),
    enabled: Boolean(user),
  });

  const grouped = groupLeads(leadsQuery.data?.data ?? []);

  return (
      <div className="flex min-h-[calc(100dvh-8rem)] flex-col md:min-h-[calc(100vh-4rem)]">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3 md:px-6">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Filter pipeline…"
              className="h-10 min-w-[200px] max-w-full rounded-lg border border-border bg-surface px-3 py-2 pl-9 text-sm shadow-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-72"
              disabled
            />
          </div>
          <button
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground opacity-70"
            disabled
            type="button"
          >
            <Filter className="h-3.5 w-3.5" /> Server filters pending
          </button>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" /> Capture lead
            </Link>
          </div>
        </div>

        {leadsQuery.isLoading ? (
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : leadsQuery.isError ? (
          <EmptyState
            icon={AlertTriangle}
            title="Unable to load leads"
            description="The authenticated leads API did not respond successfully."
          />
        ) : (
          <div className="flex-1 overflow-x-auto scrollbar-thin overscroll-x-contain">
            <div className="flex h-full min-w-max gap-2 p-2 sm:gap-3 sm:p-4">
              {stages.map((stage) => {
                const columnLeads = grouped[stage.key] ?? [];
                return (
                  <div
                    key={stage.key}
                    className="flex w-[min(300px,85vw)] shrink-0 flex-col rounded-xl border border-border bg-surface/40 sm:w-[280px] md:w-[300px]"
                  >
                    <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${stage.color}`} />
                        <span className="text-sm font-semibold text-foreground">{stage.label}</span>
                        <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {columnLeads.length}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2 overflow-y-auto p-2 scrollbar-thin">
                      {columnLeads.length ? (
                        columnLeads.map((lead) => (
                          <LeadCard
                            key={lead.id}
                            lead={lead}
                            listQueryKey={listQueryKey}
                            allowDelete={scope === "admin"}
                          />
                        ))
                      ) : (
                        <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                          No persisted leads in this stage.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
  );
}

function LeadCard({
  lead,
  listQueryKey,
  allowDelete,
}: {
  lead: BackendLead;
  listQueryKey: LeadsQueryKey;
  allowDelete: boolean;
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
  const [paymentResult, setPaymentResult] = useState<import("@/services/booking-orchestration.service").PaymentRequestResult | null>(null);

  useEffect(() => {
    if (!bookingOpen) return;
    setGrossInput("");
    setCurrency("USD");
    setPartner("");
    setConfirmationRef("");
    setNotes("");
    setLocalError(null);
    setPaymentResult(null);
  }, [bookingOpen]);

  const updateMutation = useMutation({
    mutationFn: (status: BackendLeadStatus) => leadsService.updateStatus(lead.id, status),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: listQueryKey });
      const previous = queryClient.getQueryData<BackendPaginatedResponse<BackendLead>>(listQueryKey);
      queryClient.setQueryData<BackendPaginatedResponse<BackendLead>>(listQueryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((row) => (row.id === lead.id ? { ...row, status: next } : row)),
        };
      });
      return { previous };
    },
    onError: (_err, _next, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(listQueryKey, ctx.previous);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const requestPaymentMutation = useMutation({
    mutationFn: (payload: {
      gross_revenue: number;
      currency: string;
      partner_name?: string;
      confirmation_reference?: string;
      notes?: string;
    }) =>
      bookingOrchestrationService.requestPaymentForLead({
        lead_id: lead.id,
        ...payload,
      }),
    onSuccess: (result) => {
      setPaymentResult(result);
      void queryClient.invalidateQueries({ queryKey: paymentQueryKeys.root });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
      await queryClient.invalidateQueries({ queryKey: ["booking-operations"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => leadsService.deleteLead(lead.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: listQueryKey });
      const previous = queryClient.getQueryData<BackendPaginatedResponse<BackendLead>>(listQueryKey);
      queryClient.setQueryData<BackendPaginatedResponse<BackendLead>>(listQueryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((row) => row.id !== lead.id),
          total: Math.max(0, old.total - 1),
        };
      });
      return { previous };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(listQueryKey, ctx.previous);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const qualityMutation = useMutation({
    mutationFn: (retentionDays: number) => {
      const retainUntil = new Date();
      retainUntil.setDate(retainUntil.getDate() + retentionDays);
      return leadsService.patchLead(lead.id, {
        is_high_quality: true,
        retain_until: retainUntil.toISOString(),
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
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
      const previous = queryClient.getQueryData<BackendPaginatedResponse<BackendLead>>(listQueryKey);
      const when = new Date();
      when.setDate(when.getDate() + 2);
      when.setHours(9, 0, 0, 0);
      const iso = when.toISOString();
      queryClient.setQueryData<BackendPaginatedResponse<BackendLead>>(listQueryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((row) => (row.id === lead.id ? { ...row, follow_up_at: iso } : row)),
        };
      });
      return { previous };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(listQueryKey, ctx.previous);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const pending =
    updateMutation.isPending ||
    deleteMutation.isPending ||
    followUpMutation.isPending ||
    requestPaymentMutation.isPending ||
    qualityMutation.isPending;

  const followUpScheduled =
    lead.follow_up_at && !Number.isNaN(Date.parse(lead.follow_up_at))
      ? new Date(lead.follow_up_at) > new Date()
      : false;

  function buildBookingPayload() {
    const gross = Number.parseFloat(grossInput);
    if (!Number.isFinite(gross) || gross <= 0) {
      setLocalError("Enter a valid gross corridor revenue.");
      return null;
    }
    const cur = currency.trim().toUpperCase().slice(0, 3) || "USD";
    const payload: {
      gross_revenue: number;
      currency: string;
      partner_name?: string;
      confirmation_reference?: string;
      notes?: string;
    } = { gross_revenue: gross, currency: cur };
    const pn = partner.trim();
    const cr = confirmationRef.trim();
    const nt = notes.trim();
    if (pn) payload.partner_name = pn;
    if (cr) payload.confirmation_reference = cr;
    if (nt) payload.notes = nt;
    return payload;
  }

  function submitRequestPayment(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    const payload = buildBookingPayload();
    if (!payload) return;
    requestPaymentMutation.mutate(payload);
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
    (requestPaymentMutation.error && typeof requestPaymentMutation.error === "object" && "message" in requestPaymentMutation.error
      ? String((requestPaymentMutation.error as { message: string }).message)
      : null);

  return (
    <>
    <div className="group block rounded-lg border border-border bg-surface p-3 transition hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg hover:shadow-black/30">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar name={lead.customer_name} />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-foreground">{lead.customer_name}</div>
            <div className="text-[11px] text-muted-foreground">{lead.id.slice(0, 8)}</div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge tone={statusTone(lead.status)}>{statusLabel(lead.status)}</Badge>
          {lead.is_high_quality ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-400">
              <Star className="h-3 w-3 fill-current" /> High quality
            </span>
          ) : null}
          {followUpScheduled ? (
            <span className="text-[10px] font-medium text-amber-400">
              Follow-up {new Date(lead.follow_up_at as string).toLocaleDateString()}
            </span>
          ) : null}
        </div>
      </div>
      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        <div className="line-clamp-2 text-foreground/90">
          {lead.pickup_location}
          {" → "}
          {lead.drop_location}
        </div>
        <div>{formatDateRange(lead.pickup_datetime, lead.return_datetime)}</div>
        <div className="truncate">{formatPhoneDisplay(lead.customer_phone)}</div>
        {lead.retain_until ? (
          <div className="text-[10px] text-amber-400/90">
            Retain until {new Date(lead.retain_until).toLocaleDateString()}
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5">
        <span className="text-xs text-muted-foreground">{lead.assigned_agent?.name ?? "Unassigned"}</span>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {nextStatus ? (
          <button
            type="button"
            onClick={advanceStage}
            disabled={pending}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-center text-[11px] font-medium text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {lead.status === "CONFIRMED" && nextStatus === "COMPLETED"
              ? "Request Payment"
              : `Mark ${statusLabel(nextStatus)}`}
          </button>
        ) : null}
        <div className={`grid gap-2 ${allowDelete ? "grid-cols-3" : "grid-cols-2"}`}>
          <button
            type="button"
            onClick={() => qualityMutation.mutate(90)}
            disabled={pending || lead.is_high_quality}
            title="Mark high quality — retain 90 days for re-approach"
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-amber-500/35 bg-amber-500/10 px-2 py-2 text-[10px] font-semibold text-amber-100 hover:bg-amber-500/20 disabled:opacity-50"
          >
            <Star className="h-3.5 w-3.5" />
            Quality
          </button>
          <button
            type="button"
            onClick={() => followUpMutation.mutate()}
            disabled={pending}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-amber-500/35 bg-amber-500/10 px-2 py-2 text-[10px] font-semibold text-amber-100 hover:bg-amber-500/20 disabled:opacity-50"
          >
            <CalendarClock className="h-3.5 w-3.5" />
            Follow-up
          </button>
          {allowDelete ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Remove this lead from the pipeline? This cannot be undone.")) {
                  deleteMutation.mutate();
                }
              }}
              disabled={pending}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-destructive/40 bg-destructive/10 px-2 py-2 text-[10px] font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          ) : null}
        </div>
      </div>
    </div>

    <Dialog
      open={bookingOpen}
      onOpenChange={(open) => {
        setBookingOpen(open);
        if (!open) requestPaymentMutation.reset();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-surface sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Payment</DialogTitle>
          <DialogDescription>
            {lead.customer_name} · {lead.pickup_location} → {lead.drop_location}. Creates the
            booking and payment session in one step — finance is notified immediately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submitRequestPayment} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`gross-${lead.id}`}>Gross revenue</Label>
              <input
                id={`gross-${lead.id}`}
                type="number"
                min={0}
                step="0.01"
                value={grossInput}
                onChange={(ev) => setGrossInput(ev.target.value)}
                required
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`cur-${lead.id}`}>Currency</Label>
              <input
                id={`cur-${lead.id}`}
                type="text"
                maxLength={3}
                value={currency}
                onChange={(ev) => setCurrency(ev.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm uppercase text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="USD"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`partner-${lead.id}`}>Partner / supplier (optional)</Label>
            <input
              id={`partner-${lead.id}`}
              type="text"
              value={partner}
              onChange={(ev) => setPartner(ev.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`conf-${lead.id}`}>Confirmation reference (optional)</Label>
            <input
              id={`conf-${lead.id}`}
              type="text"
              value={confirmationRef}
              onChange={(ev) => setConfirmationRef(ev.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`notes-${lead.id}`}>Internal notes (optional)</Label>
            <textarea
              id={`notes-${lead.id}`}
              rows={3}
              value={notes}
              onChange={(ev) => setNotes(ev.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {paymentResult ? (
            <div className="space-y-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">
              <p className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Payment session queued for finance
              </p>
              <p className="text-xs text-success/90">
                Booking {paymentResult.booking.id.slice(0, 8)}… · Session{" "}
                {paymentResult.session.id.slice(0, 8)}… ·{" "}
                {paymentResult.queue_item.gateway_name}
              </p>
            </div>
          ) : null}
          {bookingErr ? <p className="text-sm font-medium text-destructive">{bookingErr}</p> : null}
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
              onClick={() => setBookingOpen(false)}
            >
              {paymentResult ? "Done" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={pending || Boolean(paymentResult)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <CreditCard className="h-4 w-4" />
              {requestPaymentMutation.isPending ? "Sending…" : "Request Payment"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}

function groupLeads(leads: BackendLead[]) {
  return leads.reduce(
    (acc, lead) => {
      acc[lead.status] = [...(acc[lead.status] ?? []), lead];
      return acc;
    },
    {} as Record<BackendLeadStatus, BackendLead[]>,
  );
}

function getNextStatus(status: BackendLeadStatus): BackendLeadStatus | null {
  const index = stages.findIndex((stage) => stage.key === status);
  return index >= 0 ? stages[index + 1]?.key ?? null : null;
}

function statusTone(status: BackendLeadStatus): BadgeTone {
  if (status === "CONFIRMED" || status === "COMPLETED") return "success";
  if (status === "NEGOTIATING") return "warning";
  if (status === "CONTACTED") return "info";
  return "neutral";
}

function statusLabel(status: BackendLeadStatus) {
  return status.toLowerCase().replace(/^\w/, (char) => char.toUpperCase());
}

function formatDateRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}
