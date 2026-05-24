"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ComponentType } from "react";
import { Mic, MicOff, Pause, Phone, PhoneOff, Play, Shuffle } from "lucide-react";
import { ActiveCallCard } from "./ActiveCallCard";
import { AgentPresenceIndicator } from "./AgentPresenceIndicator";
import { CallStatusBadge } from "./CallStatusBadge";
import { CallTimer } from "./CallTimer";
import { DialPad } from "./DialPad";
import type { LiveCallSession } from "@/lib/calls/types";
import type { AgentPresence } from "@/lib/calls/types";

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
  onSelectCall: (callId: string) => void;
  selectedCallId: string | null;
  leadLabelById: Record<string, string>;
  agentLabelById: Record<string, string>;
}) {
  return (
    <section className="flex h-full min-h-0 flex-col bg-slate-950/30">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-4 md:px-6">
        <div>
          <h1 className="text-lg font-semibold text-white">Call center</h1>
          <p className="text-xs text-slate-400">
            Realtime {socketConnected ? "connected" : "reconnecting..."}
            {isAdmin ? " · Admin view (all live calls)" : ""}
          </p>
        </div>
        <AgentPresenceIndicator presence={presence} onChange={onPresenceChange} />
      </header>

      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 md:grid-cols-[minmax(0,1fr)_280px] md:p-6">
        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeCall ? (
              <motion.div
                key={activeCall.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-xl"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500">
                      Active session
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold text-white">
                      {leadName ??
                        (activeCall.direction === "OUTBOUND"
                          ? activeCall.to_number
                          : activeCall.from_number)}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
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
                    disabled={isDialing || presence === "offline"}
                  />
                </div>

                <p className="mt-4 text-xs text-slate-500">
                  Mute and hold are local agent controls until Vonage client controls are wired. End
                  removes the session from your workspace; Vonage will emit CALL_COMPLETED when the
                  line closes.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/20 px-6 py-16 text-center"
              >
                <Phone className="mb-3 h-10 w-10 text-slate-600" />
                <p className="text-lg font-medium text-slate-200">No active call</p>
                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  Select a lead from the queue or dial a number to start an outbound call through
                  Vonage.
                </p>
                <button
                  type="button"
                  onClick={onCallLead}
                  disabled={isDialing || presence === "offline"}
                  className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50"
                >
                  <Phone className="h-4 w-4" />
                  {isDialing ? "Dialing..." : "Start outbound call"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {isAdmin && liveCalls.length > 0 ? (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
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

        <div className="min-h-0 overflow-y-auto rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Dial pad
          </h3>
          <DialPad
            value={dialValue}
            onDigit={onDigit}
            onBackspace={onBackspace}
            disabled={isDialing || presence === "offline"}
          />
          <button
            type="button"
            onClick={onDial}
            disabled={!dialValue.trim() || isDialing || presence === "offline"}
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
          ? "border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
          : active
            ? "border-sky-500/50 bg-sky-500/15 text-sky-100"
            : "border-slate-700/60 bg-slate-800/50 text-slate-200 hover:border-slate-600"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </motion.button>
  );
}
