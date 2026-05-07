import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { Avatar, Badge, Panel, PanelHeader } from "@/components/app/primitives";
import {
  ArrowLeft,
  CalendarDays,
  Mail,
  MapPin,
  Mic,
  MicOff,
  Pause,
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneOff,
  Plus,
  Sparkles,
  StickyNote,
  Tag,
  Building2,
  Disc,
} from "lucide-react";

export const Route = createFileRoute("/app/leads/$leadId")({
    component: LeadDetail,
});

function LeadDetail() {
  const { leadId } = Route.useParams();
  return (
    <AppShell title={`Lead ${leadId}`}>
      <div className="flex items-center gap-3 border-b border-border px-6 py-3 text-xs">
        <Link to="/app/leads" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to pipeline
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground">Sarah Chen</span>
        <Badge tone="warning">Negotiating</Badge>
        <Badge tone="primary">Score 92</Badge>
        <div className="ml-auto flex items-center gap-2">
          <button className="rounded-md border border-border bg-surface px-2.5 py-1.5 hover:bg-surface-2">Reassign</button>
          <button className="rounded-md bg-primary px-2.5 py-1.5 font-semibold text-primary-foreground hover:opacity-90">Confirm booking</button>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-12">
        {/* LEFT — Customer profile */}
        <div className="space-y-4 lg:col-span-3">
          <Panel>
            <div className="flex flex-col items-center border-b border-border p-5">
              <Avatar name="Sarah Chen" tone="amber" />
              <div className="mt-3 text-base font-semibold text-foreground">Sarah Chen</div>
              <div className="text-xs text-muted-foreground">Premium customer · Loyalty Gold</div>
              <div className="mt-3 flex gap-1.5">
                <button className="rounded-md border border-border bg-surface-2 px-2 py-1 text-[11px] hover:bg-accent"><Phone className="h-3 w-3" /></button>
                <button className="rounded-md border border-border bg-surface-2 px-2 py-1 text-[11px] hover:bg-accent"><Mail className="h-3 w-3" /></button>
                <button className="rounded-md border border-border bg-surface-2 px-2 py-1 text-[11px] hover:bg-accent"><StickyNote className="h-3 w-3" /></button>
              </div>
            </div>
            <dl className="space-y-3 px-5 py-4 text-xs">
              <Field label="Phone" value="+1 (***) ***-4218" muted />
              <Field label="Email" value="s.chen@***.com" muted />
              <Field label="Location" value="New York, NY" />
              <Field label="Lifetime value" value="$8,420" />
              <Field label="Source" value="Google Ads · Brand" />
              <Field label="Created" value="May 4, 2026 · 14:22" />
            </dl>
          </Panel>

          <Panel>
            <PanelHeader title="Travel requirements" />
            <dl className="space-y-3 px-5 py-4 text-xs">
              <Field label="Pickup" value="JFK Airport, NY" icon={MapPin} />
              <Field label="Drop-off" value="Manhattan, NY" icon={MapPin} />
              <Field label="Dates" value="May 12 → May 18" icon={CalendarDays} />
              <Field label="Vehicle" value="Premium SUV · 7 seats" icon={Tag} />
              <Field label="Budget" value="$1,240" icon={Tag} />
            </dl>
          </Panel>

          <Panel>
            <PanelHeader title="Notes" right={<button className="text-muted-foreground hover:text-foreground"><Plus className="h-3.5 w-3.5" /></button>} />
            <div className="space-y-3 p-5 text-xs">
              <div className="rounded-md border border-border bg-surface-2 p-3 text-foreground/90">Customer prefers black exterior. Confirmed flexibility on pickup time.</div>
              <div className="rounded-md border border-border bg-surface-2 p-3 text-foreground/90">Asked about child seat — confirmed availability via Hertz JFK.</div>
            </div>
          </Panel>
        </div>

        {/* CENTER — Operational timeline */}
        <div className="space-y-4 lg:col-span-6">
          <Panel>
            <PanelHeader
              title="Operational timeline"
              right={<Badge tone="info"><Sparkles className="h-3 w-3" /> AI summary</Badge>}
            />
            <div className="border-b border-border bg-surface-2/40 px-5 py-4 text-xs text-foreground/80">
              <span className="font-semibold text-foreground">AI summary · </span>
              Sarah is negotiating a 6-day premium SUV rental from JFK. Sensitive on pickup time, not on price. Likely to convert in 24h. Recommend Hertz JFK with child seat add-on.
            </div>
            <ol className="relative px-5 py-4">
              <span className="absolute left-[22px] top-4 bottom-4 w-px bg-border" />
              {timeline.map((t, i) => (
                <li key={i} className="relative flex gap-3 py-3">
                  <span className={`relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border ${t.iconBg}`}>
                    <t.icon className="h-3 w-3 text-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-foreground">{t.title}</span>
                      <span className="text-muted-foreground">· {t.time}</span>
                    </div>
                    {t.body && <p className="mt-1 text-xs text-muted-foreground">{t.body}</p>}
                    {t.tags && (
                      <div className="mt-1.5 flex gap-1.5">
                        {t.tags.map((tg) => <Badge key={tg.l} tone={tg.t as any}>{tg.l}</Badge>)}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        {/* RIGHT — Communication console */}
        <div className="space-y-4 lg:col-span-3">
          <Panel>
            <PanelHeader title="Live call" right={<Badge tone="success">● 02:34</Badge>} />
            <div className="p-5">
              <div className="flex flex-col items-center text-center">
                <Avatar name="Sarah Chen" tone="amber" />
                <div className="mt-3 text-sm font-semibold text-foreground">Sarah Chen</div>
                <div className="text-xs text-muted-foreground">+1 (***) ***-4218</div>
                <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-success">
                  <Disc className="h-3 w-3 animate-pulse" /> Recording
                </div>
              </div>
              <div className="mt-5 grid grid-cols-4 gap-2">
                <CallBtn icon={MicOff} label="Mute" />
                <CallBtn icon={Pause} label="Hold" />
                <CallBtn icon={PhoneForwarded} label="Transfer" />
                <CallBtn icon={Plus} label="Add" />
              </div>
              <button className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground hover:opacity-90">
                <PhoneOff className="h-4 w-4" /> End call
              </button>
              <button className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface-2 py-2 text-xs text-foreground hover:bg-accent">
                <Mic className="h-3.5 w-3.5" /> Whisper coach
              </button>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Provider matching" right={<Badge tone="primary"><Sparkles className="h-3 w-3" /> AI</Badge>} />
            <ul className="divide-y divide-border">
              {[
                { n: "Hertz JFK", v: "$1,180", s: 96, t: "success" },
                { n: "Enterprise JFK", v: "$1,220", s: 92, t: "primary" },
                { n: "Sixt JFK", v: "$1,290", s: 87, t: "info" },
              ].map((p) => (
                <li key={p.n} className="flex items-center gap-3 px-5 py-3">
                  <div className="grid h-7 w-7 place-items-center rounded-md bg-surface-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-foreground">{p.n}</div>
                    <div className="text-[10px] text-muted-foreground">Match {p.s}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-foreground">{p.v}</div>
                    <button className="text-[10px] font-medium text-primary hover:underline">Reserve</button>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <PanelHeader title="Quick actions" />
            <div className="grid grid-cols-2 gap-2 p-3">
              {[
                ["Send quote", PhoneCall],
                ["Email summary", Mail],
                ["Schedule callback", CalendarDays],
                ["Mark won", Tag],
              ].map(([l, I]) => (
                <button key={l as string} className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface-2 px-2 py-2 text-[11px] text-foreground hover:bg-accent">
                  {/* @ts-ignore */}
                  <I className="h-3 w-3" /> {l}
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, value, muted, icon: Icon }: { label: string; value: string; muted?: boolean; icon?: any }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`flex items-center gap-1.5 text-right ${muted ? "text-muted-foreground" : "text-foreground"}`}>
        {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
        {value}
      </dd>
    </div>
  );
}

function CallBtn({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <button className="flex flex-col items-center gap-1 rounded-lg border border-border bg-surface-2 py-2.5 text-[10px] text-foreground hover:bg-accent">
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

const timeline = [
  {
    icon: PhoneCall,
    iconBg: "bg-success/15",
    title: "Inbound call connected",
    time: "2 min ago",
    body: "Agent Alex Kim picked up. Duration ongoing.",
    tags: [{ l: "Live", t: "success" }],
  },
  {
    icon: Mail,
    iconBg: "bg-info/15",
    title: "Quote sent — Premium SUV",
    time: "12 min ago",
    body: "Quote $1,240 with insurance + child seat add-on.",
    tags: [{ l: "Email", t: "info" }, { l: "Quote", t: "primary" }],
  },
  {
    icon: Sparkles,
    iconBg: "bg-primary/15",
    title: "Lead score raised to 92",
    time: "26 min ago",
    body: "AI raised score after positive call sentiment & high-intent keywords.",
  },
  {
    icon: StickyNote,
    iconBg: "bg-surface-2",
    title: "Internal note added",
    time: "1 hr ago",
    body: '"Customer is flexible on pickup time. Confirmed black exterior preference."',
  },
  {
    icon: Tag,
    iconBg: "bg-warning/15",
    title: "Stage moved → Negotiating",
    time: "3 hr ago",
  },
];
