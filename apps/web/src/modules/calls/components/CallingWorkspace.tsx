"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  useAddLeadNoteMutation,
  useLeadRealtimeInvalidation,
  useLeadsQuery,
} from "@/hooks/api/use-leads-api";
import { useCreateOutboundCallMutation } from "@/hooks/api/use-calls-api";
import { useCallsStore } from "@/lib/calls/store";
import type { PaginatedLeads } from "@/lib/leads/types";
import { useCallRealtime } from "@/modules/calls/hooks/use-call-realtime";
import { ActiveCallCenterPanel } from "./ActiveCallCenterPanel";
import { LeadDetailsPanel } from "./LeadDetailsPanel";
import { LeadQueueSidebar } from "./LeadQueueSidebar";

function normalizePhone(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return trimmed;
}

export function CallingWorkspace({ initialLeads }: { initialLeads: PaginatedLeads }) {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole(["admin"]);

  const selectedLeadId = useCallsStore((state) => state.selectedLeadId);
  const selectedCallId = useCallsStore((state) => state.selectedCallId);
  const dialValue = useCallsStore((state) => state.dialValue);
  const presence = useCallsStore((state) => state.presence);
  const lastError = useCallsStore((state) => state.lastError);
  const socketConnected = useCallsStore((state) => state.socketConnected);
  const showTransferPlaceholder = useCallsStore((state) => state.showTransferPlaceholder);

  const selectLead = useCallsStore((state) => state.selectLead);
  const selectCall = useCallsStore((state) => state.selectCall);
  const setDialValue = useCallsStore((state) => state.setDialValue);
  const appendDialDigit = useCallsStore((state) => state.appendDialDigit);
  const setPresence = useCallsStore((state) => state.setPresence);
  const setCallMute = useCallsStore((state) => state.setCallMute);
  const setCallHold = useCallsStore((state) => state.setCallHold);
  const endCallSession = useCallsStore((state) => state.endCallSession);
  const setShowTransferPlaceholder = useCallsStore((state) => state.setShowTransferPlaceholder);
  const setLastError = useCallsStore((state) => state.setLastError);
  const visibleLiveCalls = useCallsStore((state) => state.visibleLiveCalls);
  const syncPresenceFromCalls = useCallsStore((state) => state.syncPresenceFromCalls);
  const liveCallsRecord = useCallsStore((state) => state.liveCalls);

  const leadsQuery = useLeadsQuery({ page: 1, pageSize: 50, status: "ALL" }, initialLeads);
  const outboundMutation = useCreateOutboundCallMutation();
  const addNoteMutation = useAddLeadNoteMutation();

  useLeadRealtimeInvalidation(isAdmin);
  useCallRealtime({
    userId: user?.id ?? "",
    role: user?.role ?? "sales_agent",
  });

  const leads = leadsQuery.data?.data ?? initialLeads.data;
  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? null,
    [leads, selectedLeadId],
  );

  const liveCalls = useMemo(() => {
    if (!user) return [];
    return visibleLiveCalls({ currentUserId: user.id, isAdmin });
  }, [isAdmin, liveCallsRecord, user, visibleLiveCalls]);

  const activeCall = useMemo(() => {
    if (selectedCallId && liveCallsRecord[selectedCallId]) {
      return liveCallsRecord[selectedCallId];
    }
    return liveCalls[0] ?? null;
  }, [liveCalls, liveCallsRecord, selectedCallId]);

  const leadLabelById = useMemo(
    () => Object.fromEntries(leads.map((lead) => [lead.id, lead.customer_name])),
    [leads],
  );

  const agentLabelById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const lead of leads) {
      if (lead.assigned_agent) map[lead.assigned_agent.id] = lead.assigned_agent.name;
    }
    if (user) map[user.id] = user.name;
    return map;
  }, [leads, user]);

  async function startOutbound(toNumber: string, leadId?: string) {
    if (!user) return;
    const normalized = normalizePhone(toNumber);
    if (!normalized) {
      setLastError("Enter a valid phone number.");
      return;
    }

    try {
      await outboundMutation.mutateAsync({
        to_number: normalized,
        lead_id: leadId,
      });
      syncPresenceFromCalls(user.id);
    } catch {
      // Error stored in mutation / store
    }
  }

  function handleCallLead() {
    if (selectedLead) {
      void startOutbound(selectedLead.customer_phone, selectedLead.id);
      return;
    }
    if (dialValue.trim()) {
      void startOutbound(dialValue);
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-400">
        Loading session...
      </div>
    );
  }

  return (
    <div className="calls-workspace flex min-h-[calc(100vh-3.5rem)] flex-col">
      {lastError ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200"
        >
          {lastError}
          <button
            type="button"
            onClick={() => setLastError(null)}
            className="ml-3 text-xs underline"
          >
            Dismiss
          </button>
        </motion.div>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_340px]">
        <div className="hidden min-h-0 lg:block">
          <LeadQueueSidebar
            leads={leads}
            isLoading={leadsQuery.isLoading}
            error={leadsQuery.error?.message ?? null}
            selectedLeadId={selectedLeadId}
            onSelectLead={(leadId) => {
              selectLead(leadId);
              const lead = leads.find((item) => item.id === leadId);
              if (lead) setDialValue(lead.customer_phone);
            }}
          />
        </div>

        <ActiveCallCenterPanel
          activeCall={activeCall}
          liveCalls={liveCalls}
          leadName={activeCall?.lead_id ? leadLabelById[activeCall.lead_id] : undefined}
          presence={presence}
          onPresenceChange={setPresence}
          dialValue={dialValue}
          onDigit={appendDialDigit}
          onBackspace={() => setDialValue(dialValue.slice(0, -1))}
          onDial={() => void startOutbound(dialValue)}
          onCallLead={handleCallLead}
          onMuteToggle={() => {
            if (!activeCall) return;
            setCallMute(activeCall.id, !activeCall.isMuted);
          }}
          onHoldToggle={() => {
            if (!activeCall) return;
            setCallHold(activeCall.id, !activeCall.isOnHold);
          }}
          onEndCall={() => {
            if (!activeCall) return;
            endCallSession(activeCall.id);
            syncPresenceFromCalls(user.id);
          }}
          onTransfer={() => setShowTransferPlaceholder(true)}
          isDialing={outboundMutation.isPending}
          isAdmin={isAdmin}
          socketConnected={socketConnected}
          onSelectCall={selectCall}
          selectedCallId={selectedCallId}
          leadLabelById={leadLabelById}
          agentLabelById={agentLabelById}
        />

        <div className="hidden min-h-0 xl:block">
          <LeadDetailsPanel
            lead={selectedLead}
            isLoading={leadsQuery.isLoading && !selectedLead}
            isSavingNote={addNoteMutation.isPending}
            noteError={addNoteMutation.error?.message ?? null}
            onAddNote={async (body) => {
              if (!selectedLead) return;
              await addNoteMutation.mutateAsync({ lead: selectedLead, body });
            }}
          />
        </div>
      </div>

      <div className="border-t border-slate-800/80 p-3 lg:hidden">
        <LeadQueueSidebar
          leads={leads}
          isLoading={leadsQuery.isLoading}
          error={leadsQuery.error?.message ?? null}
          selectedLeadId={selectedLeadId}
          onSelectLead={(leadId) => {
            selectLead(leadId);
            const lead = leads.find((item) => item.id === leadId);
            if (lead) setDialValue(lead.customer_phone);
          }}
        />
      </div>

      <AnimatePresence>
        {showTransferPlaceholder ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowTransferPlaceholder(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-white">Transfer</h3>
              <p className="mt-2 text-sm text-slate-400">
                Warm transfer and agent routing will connect here when the telephony control API is
                enabled.
              </p>
              <button
                type="button"
                onClick={() => setShowTransferPlaceholder(false)}
                className="mt-4 h-10 rounded-lg bg-slate-800 px-4 text-sm font-medium text-white hover:bg-slate-700"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
