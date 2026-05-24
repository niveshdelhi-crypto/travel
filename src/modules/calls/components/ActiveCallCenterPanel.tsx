import { AnimatePresence, motion } from "framer-motion";
import type { ComponentType } from "react";
import { Mic, MicOff, Pause, Phone, PhoneOff, Play, Shuffle } from "lucide-react";
import { ActiveCallCard } from "./ActiveCallCard";
import { AgentPresenceIndicator } from "./AgentPresenceIndicator";
import { CallStatusBadge } from "./CallStatusBadge";
import { CallTimer } from "./CallTimer";
import { DialPad } from "./DialPad";
import type { AgentPresence, LiveCallSession } from "@/types/calls";

export function ActiveCallCenterPanel({
  activeCall,
  liveCalls,
  leadName,
  presence,
  onPresenceChange,
  dialValue,
  onDigit,
  onBackspace,
  onDial,
  onCallLead,
  onMuteToggle,
  onHoldToggle,
  onEndCall,
  onTransfer,
  isDialing,
  isAdmin,
  socketConnected,
  vonageConfigured,
  onSelectCall,
  selectedCallId,
  leadLabelById,
  agentLabelById,
}: {
  activeCall: LiveCallSession | null;
  liveCalls: LiveCallSession[];
  leadName?: string;
  presence: AgentPresence;
  onPresenceChange: (presence: AgentPresence) => void;
  dialValue: string;
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onDial: () => void;
  onCallLead: () => void;
  onMuteToggle: () => void;
  onHoldToggle: () => void;
  onEndCall: () => void;
  onTransfer: () => void;
  isDialing: boolean;
  isAdmin: boolean;
  socketConnected: boolean;
  vonageConfigured: boolean;
  onSelectCall: (callId: string) => void;
  selectedCallId: string | null;
  leadLabelById: Record<string, string>;
  agentLabelById: Record<string, string>;
}) {
  const dialDisabled = isDialing || presence === "offline" || !vonageConfigured;

  return (
    <section className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Call center</h1>
          <p className="text-xs text-muted-foreground">
            Realtime {socketConnected ? "connected" : "reconnecting…"}
            {isAdmin ? " · Admin view (all live calls)" : ""}
            {!vonageConfigured ? " · Vonage not configured on API" : ""}
          </p>
        </div>
        <AgentPresenceIndicator presence={presence} onChange={onPresenceChange} />
      </header>

      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden p-3 sm:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] sm:p-4 md:p-6">
        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeCall ? (
              <motion.div
                key={activeCall.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-2 p-5 shadow-lg"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      Active session
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold text-foreground">
                      {leadName ??
                        (activeCall.direction === "OUTBOUND"
                          ? activeCall.to_number
                          : activeCall.from_number)}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {activeCall.direction === "OUTBOUND"
                        ? `Outbound → ${activeCall.to_number}`
                        : `Inbound ← ${activeCall.from_number}`}
                    </p>
                  </div>
                  <CallStatusBadge status={activeCall.status} />
                </div>

                <div className="mt-6">
                  <CallTimer
                    status={activeCall.status}
                    startedAt={activeCall.started_at}
                    answeredAt={activeCall.answered_at}
                    endedAt={activeCall.ended_at}
                    size="lg"
                  />
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <ControlButton
                    label={activeCall.isMuted ? "Unmute" : "Mute"}
                    icon={activeCall.isMuted ? MicOff : Mic}
                    onClick={onMuteToggle}
                    active={activeCall.isMuted}
                  />
                  <ControlButton
                    label={activeCall.isOnHold ? "Resume" : "Hold"}
                    icon={activeCall.isOnHold ? Play : Pause}
                    onClick={onHoldToggle}
                    active={activeCall.isOnHold}
                  />
                  <ControlButton label="Transfer" icon={Shuffle} onClick={onTransfer} />
                  <ControlButton label="End" icon={PhoneOff} onClick={onEndCall} danger />
                  <ControlButton
                    label="Call lead"
                    icon={Phone}
                    onClick={onCallLead}
                    disabled={dialDisabled}
                  />
                </div>

                <p className="mt-4 text-xs text-muted-foreground">
                  Mute and hold are local workspace controls. End clears this session from your
                  view; Vonage webhooks emit CALL_COMPLETED when the line closes.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-2/50 px-6 py-16 text-center"
              >
                <Phone className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-lg font-medium text-foreground">No active call</p>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Select a lead from the queue or dial a number to start an outbound call through
                  Vonage.
                </p>
                <button
                  type="button"
                  onClick={onCallLead}
                  disabled={dialDisabled}
                  className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  <Phone className="h-4 w-4" />
                  {isDialing ? "Dialing…" : "Start outbound call"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {isAdmin && liveCalls.length > 0 ? (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Live calls ({liveCalls.length})
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <AnimatePresence>
                  {liveCalls.map((call) => (
                    <ActiveCallCard
                      key={call.id}
                      call={call}
                      selected={selectedCallId === call.id}
                      onSelect={() => onSelectCall(call.id)}
                      leadName={call.lead_id ? leadLabelById[call.lead_id] : undefined}
                      agentName={call.agent_id ? agentLabelById[call.agent_id] : undefined}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ) : null}
        </div>

        <div className="min-h-0 overflow-y-auto rounded-2xl border border-border bg-surface-2/50 p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Dial pad
          </h3>
          <DialPad
            value={dialValue}
            onDigit={onDigit}
            onBackspace={onBackspace}
            disabled={dialDisabled}
          />
          <button
            type="button"
            onClick={onDial}
            disabled={!dialValue.trim() || dialDisabled}
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            <Phone className="h-4 w-4" />
            Call number
          </button>
        </div>
      </div>
    </section>
  );
}

function ControlButton({
  label,
  icon: Icon,
  onClick,
  active = false,
  danger = false,
  disabled = false,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      disabled={disabled}
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 text-xs font-medium transition disabled:opacity-40 ${
        danger
          ? "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
          : active
            ? "border-primary/50 bg-primary/15 text-foreground"
            : "border-border bg-surface text-foreground hover:border-border-strong"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </motion.button>
  );
}
