import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { Panel, PanelHeader } from "@/components/app/primitives";
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Palette,
  Smartphone,
  Key,
  ChevronRight,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/app/settings")({
    component: SettingsPage,
});

const settingsSections = [
  {
    label: "Account",
    items: [
      { icon: User,        title: "Profile",           description: "Name, email, phone, avatar",          badge: null },
      { icon: Key,         title: "Security",          description: "Password, 2FA, sessions",             badge: null },
      { icon: Smartphone,  title: "Connected devices", description: "Manage trusted devices",              badge: "2 active" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { icon: Bell,        title: "Notifications",     description: "Email, SMS, push preferences",        badge: null },
      { icon: Globe,       title: "Region & language", description: "Timezone, locale, currency",          badge: null },
      { icon: Palette,     title: "Appearance",        description: "Dark mode, density, accent",          badge: null },
    ],
  },
  {
    label: "Billing",
    items: [
      { icon: CreditCard,  title: "Billing & plan",    description: "Subscription, invoices, usage",       badge: "Pro plan" },
      { icon: Shield,      title: "Compliance",        description: "GDPR, data retention, exports",       badge: null },
    ],
  },
];

const PROFILE_FIELDS = [
  { label: "Full name",   value: "Alex Kim",                    editable: true },
  { label: "Email",       value: "alex.kim@bookmycarz.io",      editable: true },
  { label: "Phone",       value: "+1 (415) 555-2840",           editable: true },
  { label: "Role",        value: "Sales Manager",               editable: false },
  { label: "Team ID",     value: "team_prod_01",                editable: false },
  { label: "Time zone",   value: "America/New_York (EST)",      editable: true },
];

function SettingsPage() {
  return (
    <AppShell title="Settings">
      <div className="mx-auto max-w-4xl space-y-8 p-6">

        {/* Navigation grid */}
        <div className="grid gap-3 md:grid-cols-3">
          {settingsSections.map((section) => (
            <div key={section.label}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.title}
                    className="group flex w-full items-center gap-3 rounded-lg border border-border bg-surface px-3 py-3 text-left transition hover:border-border-strong hover:bg-surface-2"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-muted-foreground group-hover:text-foreground transition">
                      <item.icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-foreground">{item.title}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{item.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className="rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Profile panel */}
        <Panel>
          <PanelHeader title="Profile" subtitle="Your personal information and preferences" />
          <div className="p-5">
            {/* Avatar section */}
            <div className="mb-6 flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-secondary to-info text-2xl font-bold text-foreground">
                AK
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Alex Kim</div>
                <div className="text-xs text-muted-foreground">Sales Manager · Pro plan</div>
                <button className="mt-1.5 text-xs font-medium text-primary hover:underline">
                  Change photo
                </button>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              {PROFILE_FIELDS.map((field) => (
                <div key={field.label} className="flex items-center justify-between gap-4">
                  <div className="w-32 text-xs font-medium text-muted-foreground">{field.label}</div>
                  <div className="flex flex-1 items-center justify-between rounded-md border border-border bg-surface px-3 py-2">
                    <span className="text-sm text-foreground">{field.value}</span>
                    {field.editable && (
                      <button className="text-xs font-medium text-primary hover:underline">Edit</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button className="rounded-md border border-border bg-surface px-4 py-2 text-xs font-medium text-foreground hover:bg-surface-2">
                Cancel
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
                <Check className="h-3.5 w-3.5" /> Save changes
              </button>
            </div>
          </div>
        </Panel>

        {/* Notification prefs */}
        <Panel>
          <PanelHeader title="Notification preferences" subtitle="Choose when and how you are notified" />
          <div className="divide-y divide-border">
            {[
              { label: "New lead assigned",     sub: "When a new lead is assigned to you",    email: true,  sms: false, push: true },
              { label: "Booking confirmed",      sub: "When a booking is confirmed or updated", email: true,  sms: true,  push: true },
              { label: "Payment received",       sub: "When a payment is processed",            email: true,  sms: false, push: false },
              { label: "Provider SLA alert",     sub: "When a provider SLA drops below 80%",   email: true,  sms: true,  push: true },
              { label: "Call recording ready",   sub: "When a call recording is available",    email: false, sms: false, push: true },
            ].map((pref) => (
              <div key={pref.label} className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="text-sm font-medium text-foreground">{pref.label}</div>
                  <div className="text-xs text-muted-foreground">{pref.sub}</div>
                </div>
                <div className="flex items-center gap-6 text-xs text-muted-foreground">
                  {(["email", "sms", "push"] as const).map((channel) => (
                    <label key={channel} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={pref[channel]}
                        className="accent-primary"
                      />
                      <span className="capitalize">{channel}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Danger zone */}
        <Panel>
          <PanelHeader title="Danger zone" subtitle="Irreversible account actions" />
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-foreground">Sign out all devices</div>
                <div className="text-xs text-muted-foreground">Invalidate all active sessions</div>
              </div>
              <button className="rounded-md border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10">
                Sign out all
              </button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-foreground">Delete account</div>
                <div className="text-xs text-muted-foreground">Permanently delete your account and all data</div>
              </div>
              <button className="rounded-md border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10">
                Delete account
              </button>
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
