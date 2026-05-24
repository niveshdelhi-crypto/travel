import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { onSocketEvent } from "@/services/socket";
import { normalizeToE164, isPlausibleE164 } from "@/lib/phone";
import { leadsService, telephonyService } from "@/services";
import { useAuthStore } from "@/store/auth.store";
import { useCallsStore } from "@/store/call.store";
import { useCallRealtime } from "@/hooks/use-call-realtime";
import { ActiveCallCenterPanel } from "./components/ActiveCallCenterPanel";
import { CallHistoryPanel } from "./components/CallHistoryPanel";
import { LeadDetailsPanel } from "./components/LeadDetailsPanel";
import { LeadQueueSidebar } from "./components/LeadQueueSidebar";

type MobileTab = "queue" | "call" | "details";

export function CallingWorkspace() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();
  const [mobileTab, setMobileTab] = useState<MobileTab>("call");

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
  const upsertFromApi = useCallsStore((state) => state.upsertFromApi);
  const liveCallsRecord = useCallsStore((state) => state.liveCalls);

  const leadsQuery = useQuery({
    queryKey: ["leads", isAdmin ? "admin" : "my", "calls", { page: 1, pageSize: 50 }],
    queryFn: () =>
      isAdmin
        ? leadsService.admin({ page: 1, pageSize: 50 })
        : leadsService.my({ page: 1, pageSize: 50 }),
    enabled: Boolean(user),
  });

  const outboundMutation = useMutation({
    mutationFn: (input: { to_number: string; lead_id?: string }) =>
      telephonyService.createOutbound(input),
    onMutate: () => {
      setLastError(null);
      setPresence("busy");
    },
    onSuccess: (call) => {
      upsertFromApi(call);
      setPresence("on_call");
      setMobileTab("call");
      void queryClient.invalidateQueries({ queryKey: ["calls"] });
    },
    onError: (error: Error) => {
      setLastError(error.message);
      setPresence("available");
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: ({ leadId, body }: { leadId: string; body: string }) =>
      leadsService.addNote(leadId, body),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  useCallRealtime({
    userId: user?.id ?? "",
    role: user?.role ?? "sales_agent",
  });

  useEffect(() => {
    if (!user) return undefined;
    const invalidateLeads = () => {
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
    };
    const disposers = [
      onSocketEvent("lead.updated", invalidateLeads),
      onSocketEvent("lead.note.created", invalidateLeads),
      onSocketEvent("lead.assigned", invalidateLeads),
    ];
    return () => disposers.forEach((d) => d());
  }, [queryClient, user]);

  const leads = leadsQuery.data?.data ?? [];
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

  const vonageConfigured =
    !lastError || !lastError.toLowerCase().includes("vonage telephony is not configured");

  function handleSelectLead(leadId: string) {
    selectLead(leadId);
    const lead = leads.find((item) => item.id === leadId);
    if (lead) setDialValue(normalizeToE164(lead.customer_phone));
    setMobileTab("call");
  }

  async function startOutbound(toNumber: string, leadId?: string) {
    if (!user) return;
    const normalized = normalizeToE164(toNumber);
    if (!isPlausibleE164(normalized)) {
      setLastError("Enter a valid E.164 phone number (e.g. +14155550100).");
      return;
    }
    await outboundMutation.mutateAsync({
      to_number: normalized,
      lead_id: leadId,
    });
    syncPresenceFromCalls(user.id);
  }

  function handleCallLead() {
    if (selectedLead) {
      void startOutbound(selectedLead.customer_phone, selectedLead.id);
      return;
    }
    if (dialValue.trim()) void startOutbound(dialValue);
  }

  const queueSidebar = (
    <LeadQueueSidebar
      leads={leads}
      isLoading={leadsQuery.isLoading}
      error={leadsQuery.isError ? (leadsQuery.error as Error).message : null}
      selectedLeadId={selectedLeadId}
      onSelectLead={handleSelectLead}
      className="h-full"
    />
  );

  const callPanel = (
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
        syncPresenceFromCalls(user!.id);
      }}
      onTransfer={() => setShowTransferPlaceholder(true)}
      isDialing={outboundMutation.isPending}
      isAdmin={isAdmin}
      socketConnected={socketConnected}
      vonageConfigured={vonageConfigured}
      onSelectCall={selectCall}
      selectedCallId={selectedCallId}
      leadLabelById={leadLabelById}
      agentLabelById={agentLabelById}
    />
  );

  const detailsPanel = (
    <LeadDetailsPanel
      lead={selectedLead}
      isLoading={leadsQuery.isLoading && !selectedLead}
      isSavingNote={addNoteMutation.isPending}
      noteError={addNoteMutation.error ? (addNoteMutation.error as Error).message : null}
      onAddNote={async (body) => {
        if (!selectedLead) return;
        await addNoteMutation.mutateAsync({ leadId: selectedLead.id, body });
      }}
    />
  );

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        Loading session…
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col md:min-h-[calc(100vh-4rem)]">
      {lastError ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:px-4"
        >
          <span className="line-clamp-3">{lastError}</span>
          <button
            type="button"
            onClick={() => setLastError(null)}
            className="mt-1 text-xs underline"
          >
            Dismiss
          </button>
        </motion.div>
      ) : null}

      {/* Mobile tab bar */}
      <div className="flex shrink-0 gap-1 border-b border-border bg-surface/80 p-2 lg:hidden">
        {(
          [
            { id: "queue" as const, label: "Queue" },
            { id: "call" as const, label: "Call" },
            { id: "details" as const, label: "Details" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMobileTab(tab.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
              mobileTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-surface-2 text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Desktop: 3-column */}
      <div className="hidden min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)_minmax(260px,320px)]">
        {queueSidebar}
        {callPanel}
        {detailsPanel}
      </div>

      {/* Mobile / tablet: single panel */}
      <div className="min-h-0 flex-1 overflow-hidden lg:hidden">
        {mobileTab === "queue" ? (
          <div className="h-full min-h-[280px]">{queueSidebar}</div>
        ) : null}
        {mobileTab === "call" ? <div className="h-full min-h-[320px]">{callPanel}</div> : null}
        {mobileTab === "details" ? (
          <div className="h-full min-h-[280px] overflow-y-auto">{detailsPanel}</div>
        ) : null}
      </div>

      <CallHistoryPanel />

      <AnimatePresence>
        {showTransferPlaceholder ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
            onClick={() => setShowTransferPlaceholder(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-center shadow-2xl sm:rounded-2xl"
            >
              <h3 className="text-lg font-semibold text-foreground">Transfer</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Warm transfer and agent routing will connect here when the telephony control API is
                extended.
              </p>
              <button
                type="button"
                onClick={() => setShowTransferPlaceholder(false)}
                className="mt-4 h-10 w-full rounded-lg bg-surface-2 px-4 text-sm font-medium hover:bg-accent sm:w-auto"
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
