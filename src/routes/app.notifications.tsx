import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { Badge, Panel, PanelHeader } from "@/components/app/primitives";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  CircleDollarSign,
  Phone,
  Users,
  Building2,
  Info,
  X,
  CheckCheck,
  Filter,
} from "lucide-react";
import type { Notification, NotificationType } from "@/types";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — FleetNexus CRM" }] }),
  component: NotificationsPage,
});

const notifications: Notification[] = [
  { id: "n1", type: "booking",        priority: "normal", title: "Booking BK-9821 confirmed",          body: "Sarah Chen · Range Rover Sport · Hertz JFK · $1,240",  time: "2m ago",  read: false, actionUrl: "/app/bookings" },
  { id: "n2", type: "payment",        priority: "normal", title: "Payment received — $980",             body: "Olivia Bennett · Booking BK-9817 · Visa ••4242",         time: "12m ago", read: false, actionUrl: "/app/payments" },
  { id: "n3", type: "provider_alert", priority: "urgent", title: "Avis JFK SLA dipping below 80%",      body: "Fill rate at 78.6% in the last 30 minutes. Review provider.", time: "32m ago", read: false, actionUrl: "/app/providers" },
  { id: "n4", type: "lead",           priority: "normal", title: "New lead assigned to you",            body: "Diego Alvarez · ORD → Milwaukee · Budget $1,120",        time: "1h ago",  read: false, actionUrl: "/app/leads" },
  { id: "n5", type: "call",           priority: "low",    title: "Call recording ready",                body: "Marcus Reid · Booking confirmation · 3:14 min",          time: "2h ago",  read: true,  actionUrl: "/app/calls" },
  { id: "n6", type: "system",         priority: "low",    title: "Provider sync completed",             body: "42 providers updated · 18,420 vehicles synced",          time: "3h ago",  read: true,  actionUrl: "/app/admin" },
  { id: "n7", type: "booking",        priority: "normal", title: "Booking BK-9818 pending approval",    body: "Diego Alvarez · Audi A6 · Enterprise · $1,120",          time: "5h ago",  read: true,  actionUrl: "/app/bookings" },
  { id: "n8", type: "lead",           priority: "urgent", title: "High-value lead score updated to 96", body: "Emily Watson · SEA → Vancouver · $1,680 · Score ↑96",    time: "6h ago",  read: true,  actionUrl: "/app/leads" },
];

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; bg: string; iconColor: string }> = {
  booking:        { icon: CheckCircle2,     bg: "bg-success/10",     iconColor: "text-success" },
  payment:        { icon: CircleDollarSign, bg: "bg-primary/10",     iconColor: "text-primary" },
  lead:           { icon: Users,            bg: "bg-secondary/10",   iconColor: "text-secondary" },
  call:           { icon: Phone,            bg: "bg-info/10",        iconColor: "text-info" },
  system:         { icon: Info,             bg: "bg-muted/30",       iconColor: "text-muted-foreground" },
  provider_alert: { icon: AlertTriangle,    bg: "bg-warning/10",     iconColor: "text-warning" },
};

function NotificationsPage() {
  const unread = notifications.filter((n) => !n.read).length;
  const urgent = notifications.filter((n) => n.priority === "urgent").length;

  return (
    <AppShell title="Notifications">
      <div className="p-6">
        {/* Summary strip */}
        <div className="mb-6 flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground">{unread} unread</span>
          </div>
          {urgent > 0 && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/10 px-3 py-1.5 text-xs text-warning">
              <AlertTriangle className="h-3.5 w-3.5" />
              {urgent} urgent
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs hover:bg-surface-2">
              <Filter className="h-3.5 w-3.5" /> Filter
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs hover:bg-surface-2">
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          </div>
        </div>

        <Panel>
          <PanelHeader
            title="All notifications"
            subtitle="Activity across the platform"
          />
          <ul className="divide-y divide-border">
            {notifications.map((n) => {
              const cfg = TYPE_CONFIG[n.type];
              const Icon = cfg.icon;
              return (
                <li
                  key={n.id}
                  className={`group flex items-start gap-4 px-5 py-4 transition hover:bg-surface-2 ${!n.read ? "bg-surface-2/40" : ""}`}
                >
                  {/* Unread indicator */}
                  <div className="mt-1 flex-shrink-0">
                    {!n.read && (
                      <span className="block h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                    {n.read && <span className="block h-1.5 w-1.5" />}
                  </div>

                  {/* Icon */}
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${cfg.bg}`}>
                    <Icon className={`h-4 w-4 ${cfg.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className={`text-sm font-medium ${n.read ? "text-foreground/80" : "text-foreground"}`}>
                          {n.title}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{n.body}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {n.priority === "urgent" && (
                          <Badge tone="danger">Urgent</Badge>
                        )}
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">{n.time}</span>
                        <button className="opacity-0 transition group-hover:opacity-100 text-muted-foreground hover:text-foreground">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {n.actionUrl && (
                      <a
                        href={n.actionUrl}
                        className="mt-2 inline-text text-xs font-medium text-primary hover:underline"
                      >
                        View →
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
