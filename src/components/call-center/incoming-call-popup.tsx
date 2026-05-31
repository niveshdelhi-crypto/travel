import { Badge, Panel } from "@/components/app/primitives";
import { useAuthStore } from "@/store/auth.store";
import { useCallsStore } from "@/store/call.store";
import { telephonyService } from "@/services";
import type { CallDispositionType, CustomerTier } from "@/types/call-center";
import { useMutation } from "@tanstack/react-query";
import {
  PhoneIncoming,
  PhoneOff,
  UserPlus,
  X,
  DollarSign,
  Calendar,
  Crown,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

const DISPOSITIONS: Array<{ value: CallDispositionType; label: string }> = [
  { value: "ANSWERED", label: "Answered" },
  { value: "BUSY", label: "Busy" },
  { value: "NO_ANSWER", label: "No answer" },
  { value: "VOICEMAIL", label: "Voicemail" },
  { value: "CALLBACK_REQUESTED", label: "Callback requested" },
];

function tierLabel(tier: CustomerTier) {
  switch (tier) {
    case "enterprise":
      return "Enterprise";
    case "vip":
      return "VIP";
    case "recurring":
      return "Recurring";
    default:
      return "Standard";
  }
}

function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
}

export function IncomingCallPopup() {
  const user = useAuthStore((s) => s.user);
  const incoming = useCallsStore((s) => s.incomingCall);
  const dismissIncomingCall = useCallsStore((s) => s.dismissIncomingCall);
  const navigate = useNavigate();
  const [leadName, setLeadName] = useState("");

  const dispositionMutation = useMutation({
    mutationFn: (payload: { disposition: CallDispositionType }) =>
      telephonyService.setDisposition(incoming!.id, payload),
    onSuccess: () => dismissIncomingCall(),
  });

  const createLeadMutation = useMutation({
    mutationFn: () =>
      telephonyService.quickCreateLead(incoming!.id, {
        customer_name: leadName.trim() || "Inbound caller",
      }),
    onSuccess: (data) => {
      dismissIncomingCall();
      void navigate({ to: "/app/leads/$leadId", params: { leadId: data.lead.id } });
    },
  });

  if (!incoming || !user) return null;

  const caller = incoming.caller;
  const phone = incoming.from_number ?? caller?.phone_number ?? "Unknown";
  const isExisting = caller?.is_existing_customer ?? false;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-end bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-label="Incoming call"
    >
      <Panel className="w-full max-w-md animate-in slide-in-from-right-4 shadow-2xl ring-2 ring-primary/30">
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <PhoneIncoming className="h-6 w-6 animate-pulse" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Incoming call</p>
              <p className="text-lg font-semibold text-foreground">{phone}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissIncomingCall}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {isExisting && caller ? (
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-foreground">{caller.customer_name ?? "Known customer"}</p>
                <Badge tone={caller.customer_tier === "enterprise" ? "success" : "neutral"}>
                  <Crown className="mr-1 inline h-3 w-3" />
                  {tierLabel(caller.customer_tier)}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>Lifetime {formatMoney(caller.lifetime_revenue)}</span>
                </div>
                <div className="text-muted-foreground">Bookings: {caller.bookings_count}</div>
              </div>
              {caller.last_booking ? (
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Last booking {formatMoney(caller.last_booking.gross_revenue, caller.last_booking.currency)}{" "}
                    · {new Date(caller.last_booking.created_at).toLocaleDateString()}
                  </span>
                </div>
              ) : null}
              {caller.lead_id ? (
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => {
                    dismissIncomingCall();
                    void navigate({ to: "/app/leads/$leadId", params: { leadId: caller.lead_id! } });
                  }}
                >
                  Open lead record
                </button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
              <p className="text-sm font-medium text-foreground">New customer</p>
              <p className="text-xs text-muted-foreground">No matching phone in CRM. Create a lead to continue.</p>
              <input
                type="text"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="Customer name"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={createLeadMutation.isPending}
                onClick={() => createLeadMutation.mutate()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" />
                Create lead
              </button>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Disposition</p>
            <div className="flex flex-wrap gap-2">
              {DISPOSITIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  disabled={dispositionMutation.isPending}
                  onClick={() => dispositionMutation.mutate({ disposition: d.value })}
                  className="rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-accent disabled:opacity-50"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={dismissIncomingCall}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
          >
            <PhoneOff className="h-4 w-4" />
            Dismiss popup
          </button>
        </div>
      </Panel>
    </div>
  );
}
