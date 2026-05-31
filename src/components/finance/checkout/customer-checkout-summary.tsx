import { Panel, PanelHeader } from "@/components/app/primitives";
import { formatDateTime, formatMoney } from "@/lib/payments/format";
import type { PaymentSessionDetail } from "@/types/payments-orchestration";
import { Calendar, Car, MapPin, Phone, User, Wallet } from "lucide-react";

export function CustomerCheckoutSummary({ session }: { session: PaymentSessionDetail }) {
  const vehicleLabel = session.booking.vehicle
    ? `${session.booking.vehicle.make} ${session.booking.vehicle.model} (${session.booking.vehicle.vehicle_class})`
    : null;

  return (
    <Panel className="border-primary/20 bg-gradient-to-br from-primary/5 via-surface to-surface">
      <PanelHeader
        title="Customer & booking"
        subtitle="Assisted phone checkout — verify details with the traveler before charging"
      />
      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryItem icon={User} label="Customer name" value={session.lead.customer_name} emphasize />
        <SummaryItem icon={Phone} label="Phone" value={session.lead.customer_phone} emphasize />
        <SummaryItem
          icon={Wallet}
          label="Booking amount"
          value={formatMoney(session.amount, session.currency)}
          emphasize
        />
        <SummaryItem icon={Wallet} label="Currency" value={session.currency} />
        <SummaryItem icon={MapPin} label="Pickup" value={session.lead.pickup_location} />
        <SummaryItem icon={MapPin} label="Dropoff" value={session.lead.drop_location} />
        <SummaryItem
          icon={Calendar}
          label="Pickup date"
          value={formatDateTime(session.lead.pickup_datetime)}
        />
        <SummaryItem
          icon={Calendar}
          label="Return date"
          value={formatDateTime(session.lead.return_datetime)}
        />
        {vehicleLabel ? (
          <SummaryItem icon={Car} label="Vehicle" value={vehicleLabel} className="sm:col-span-2" />
        ) : null}
      </div>
    </Panel>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  value,
  emphasize,
  className,
}: {
  icon: typeof User;
  label: string;
  value: string;
  emphasize?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p
        className={`mt-1 ${emphasize ? "text-base font-semibold text-foreground" : "text-sm font-medium text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}
