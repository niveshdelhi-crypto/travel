import { Badge } from "@/components/app/primitives";
import {
  canViewSensitiveCustomerDetails,
  maskEmail,
  maskPhone,
} from "@/lib/payments/customer-visibility";
import { RecurringCustomerBadge } from "@/components/payments/recurring-customer-badge";
import type { UserRole } from "@/types";
import { Lock, Mail, Phone, User } from "lucide-react";

export type CustomerSensitiveProfile = {
  name: string;
  email: string;
  phone: string;
  bookingCount: number;
  agentName?: string;
};

export function SensitiveCustomerPanel({
  customer,
  role,
}: {
  customer: CustomerSensitiveProfile | null;
  role: UserRole;
}) {
  if (!customer) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface-2/50 p-6 text-center text-sm text-muted-foreground">
        Select a transaction or queue item to inspect traveler details.
      </div>
    );
  }

  const isAdmin = canViewSensitiveCustomerDetails(role);

  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Traveler profile
          </p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">{customer.name}</h3>
        </div>
        <RecurringCustomerBadge count={customer.bookingCount} />
      </div>

      <div className="mt-4 space-y-3">
        <DetailRow
          icon={User}
          label="Assigned agent"
          value={customer.agentName ?? "Unassigned"}
        />
        <DetailRow
          icon={Mail}
          label="Email"
          value={maskEmail(customer.email, role)}
          restricted={!isAdmin}
        />
        <DetailRow
          icon={Phone}
          label="Phone"
          value={customer.phone ? maskPhone(customer.phone, role) : "Not on file"}
          restricted={!isAdmin}
        />
      </div>

      {!isAdmin ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Full contact details are restricted to administrators. Finance roles see masked PII.
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2 text-xs text-success">
          <Lock className="h-3.5 w-3.5" />
          Admin view — full PII visible
        </div>
      )}
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  restricted,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  restricted?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-surface-2/60 px-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
      {restricted ? <Badge tone="warning">Masked</Badge> : null}
    </div>
  );
}
