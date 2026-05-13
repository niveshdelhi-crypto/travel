import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app/app-shell";
import { Avatar, Badge, EmptyState, Panel, PanelHeader, SkeletonCard } from "@/components/app/primitives";
import { ArrowLeft, CalendarDays, Mail, MapPin, Phone, StickyNote } from "lucide-react";
import { leadsService, type BackendLeadStatus } from "@/services";
import type { BadgeTone } from "@/types";
import type { ComponentType } from "react";

export const Route = createFileRoute("/app/leads/$leadId")({
  component: LeadDetail,
});

function LeadDetail() {
  const { leadId } = Route.useParams();
  const leadQuery = useQuery({
    queryKey: ["leads", "detail", leadId],
    queryFn: () => leadsService.getOne(leadId),
  });
  const lead = leadQuery.data;

  return (
    <AppShell title={`Lead ${leadId.slice(0, 8)}`}>
      <div className="flex items-center gap-3 border-b border-border px-6 py-3 text-xs">
        <Link to="/app/leads" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to pipeline
        </Link>
        {lead ? (
          <>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground">{lead.customer_name}</span>
            <Badge tone={statusTone(lead.status)}>{statusLabel(lead.status)}</Badge>
          </>
        ) : null}
      </div>

      {leadQuery.isLoading ? (
        <div className="grid gap-4 p-4 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : leadQuery.isError || !lead ? (
        <Panel className="m-6">
          <EmptyState title="Lead not found" description="This lead either does not exist or is outside your role scope." />
        </Panel>
      ) : (
        <div className="grid gap-4 p-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <Panel>
              <div className="flex flex-col items-center border-b border-border p-5">
                <Avatar name={lead.customer_name} />
                <div className="mt-3 text-base font-semibold text-foreground">{lead.customer_name}</div>
                <div className="text-xs text-muted-foreground">{lead.customer_email}</div>
              </div>
              <dl className="space-y-3 px-5 py-4 text-xs">
                <Field label="Phone" value={lead.customer_phone} icon={Phone} />
                <Field label="Email" value={lead.customer_email} icon={Mail} />
                <Field label="Created" value={formatDate(lead.created_at)} />
                <Field label="Updated" value={formatDate(lead.updated_at)} />
              </dl>
            </Panel>

            <Panel>
              <PanelHeader title="Travel requirements" />
              <dl className="space-y-3 px-5 py-4 text-xs">
                <Field label="Pickup" value={lead.pickup_location} icon={MapPin} />
                <Field label="Drop-off" value={lead.drop_location} icon={MapPin} />
                <Field label="Pickup date" value={formatDate(lead.pickup_datetime)} icon={CalendarDays} />
                <Field label="Return date" value={formatDate(lead.return_datetime)} icon={CalendarDays} />
              </dl>
            </Panel>
          </div>

          <div className="space-y-4 lg:col-span-8">
            <Panel>
              <PanelHeader title="Assignment" subtitle="Persisted owner and current state" />
              <dl className="grid gap-3 p-5 text-sm sm:grid-cols-2">
                <Field label="Status" value={statusLabel(lead.status)} />
                <Field label="Assigned agent" value={lead.assigned_agent?.name ?? "Unassigned"} />
                <Field label="Agent email" value={lead.assigned_agent?.email ?? "Not assigned"} />
                <Field label="Booking value" value={lead.booking_value == null ? "Not set" : String(lead.booking_value)} />
              </dl>
            </Panel>

            <Panel>
              <PanelHeader title="Notes" subtitle="Persisted lead notes" />
              {lead.notes?.length ? (
                <div className="divide-y divide-border">
                  {lead.notes.map((note) => (
                    <div key={note.id} className="px-5 py-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <StickyNote className="h-4 w-4" />
                        {formatDate(note.created_at)}
                      </div>
                      <p className="mt-2 text-foreground">{note.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No notes yet" description="Authenticated note APIs are available, but this lead has no saved notes." />
              )}
            </Panel>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Field({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  );
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
