import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Badge,
  Panel,
  PanelHeader,
  Skeleton,
} from "@/components/app/primitives";
import { AuditTimeline } from "@/components/payments/audit-timeline";
import { RecurringCustomerBadge } from "@/components/payments/recurring-customer-badge";
import { CustomerCheckoutSummary } from "@/components/finance/checkout/customer-checkout-summary";
import { GatewayCheckoutPanel } from "@/components/finance/checkout/gateway-checkout-panel";
import { PaymentAttemptHistory } from "@/components/finance/checkout/payment-attempt-history";
import { bookingOrchestrationService } from "@/services/booking-orchestration.service";
import { usePaymentRealtime } from "@/hooks/use-payment-realtime";
import {
  canProcessPayments,
  canViewSensitiveCustomerDetails,
  maskCustomerName,
  maskEmail,
  maskPhone,
} from "@/lib/payments/customer-visibility";
import { formatDateTime, formatMoney, statusTone } from "@/lib/payments/format";
import { paymentQueryKeys } from "@/lib/payments/query-keys";
import { paymentsOrchestrationService } from "@/services/payments-orchestration.service";
import { getSocketStatus } from "@/services/socket";
import { useAuthStore } from "@/store/auth.store";
import type { PaymentSessionDetail, PaymentSessionStatus } from "@/types/payments-orchestration";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Car,
  MapPin,
  Radio,
  User,
  Wallet,
} from "lucide-react";

function DetailBlock({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof User;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-surface-2/30 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {Icon ? <Icon className="h-3 w-3" /> : null}
        {label}
      </div>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export function CheckoutConsoleDashboard({ sessionId }: { sessionId: string }) {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? "sales_agent";
  const canProcess = canProcessPayments(role);
  const [financeNotes, setFinanceNotes] = useState("");
  const queryClient = useQueryClient();

  usePaymentRealtime(sessionId);

  const sessionQuery = useQuery({
    queryKey: paymentQueryKeys.paymentSessionDetail(sessionId),
    queryFn: () => paymentsOrchestrationService.getPaymentSession(sessionId),
    staleTime: 30_000,
    initialData: () =>
      queryClient.getQueryData<PaymentSessionDetail>(
        paymentQueryKeys.paymentSessionDetail(sessionId),
      ),
    refetchOnMount: (query) => (query.state.data ? "always" : true),
  });

  const auditQuery = useQuery({
    queryKey: paymentQueryKeys.paymentSessionAudit(sessionId),
    queryFn: () => paymentsOrchestrationService.getPaymentSessionAudit(sessionId),
    enabled: canProcess && Boolean(sessionQuery.data),
    staleTime: 60_000,
  });

  const attemptsQuery = useQuery({
    queryKey: paymentQueryKeys.paymentSessionAttempts(sessionId),
    queryFn: () => paymentsOrchestrationService.listPaymentSessionAttempts(sessionId),
    enabled: canProcess && Boolean(sessionQuery.data),
    staleTime: 15_000,
  });

  const invalidate = () => {
    void sessionQuery.refetch();
    void attemptsQuery.refetch();
    void auditQuery.refetch();
  };

  const session = sessionQuery.data;
  const status = session?.status as PaymentSessionStatus | undefined;

  const documentsQuery = useQuery({
    queryKey: [...paymentQueryKeys.root, "booking-documents", session?.booking.id] as const,
    queryFn: () => bookingOrchestrationService.listDocuments(session!.booking.id),
    enabled: Boolean(session?.booking.id && status === "SUCCESS"),
    refetchInterval: status === "SUCCESS" ? 5_000 : false,
  });
  const traveler = session?.lead.traveler;
  const isRecurring = session?.lead.is_recurring_customer || traveler?.is_recurring;

  useEffect(() => {
    if (session?.finance_notes && !financeNotes) {
      setFinanceNotes(session.finance_notes);
    }
  }, [session?.finance_notes, financeNotes]);

  const displayName = session
    ? maskCustomerName(session.lead.customer_name, role, {
        isRecurring: Boolean(isRecurring),
        travelerId: traveler?.id,
      })
    : "—";

  const vehicleLabel = session?.booking.vehicle
    ? `${session.booking.vehicle.make} ${session.booking.vehicle.model} (${session.booking.vehicle.vehicle_class})`
    : "Vehicle TBD";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-start gap-3">
          <Link
            to="/app/finance"
            className="mt-1 rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Finance Checkout Console
            </p>
            <h2 className="mt-0.5 text-xl font-bold text-foreground">
              Session {sessionId.slice(0, 8)}…
            </h2>
            {session ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone={statusTone(session.status)}>{session.status}</Badge>
                <Badge tone="neutral">{session.gateway.name}</Badge>
                {isRecurring ? <RecurringCustomerBadge count={traveler?.booking_count ?? 2} /> : null}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Radio
            className={`h-3.5 w-3.5 ${getSocketStatus() === "connected" ? "text-success" : "text-warning"}`}
          />
          Live sync
        </div>
      </header>

      {!session && sessionQuery.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      ) : session && canProcess ? (
        <div className="space-y-4">
          <CustomerCheckoutSummary session={session} />

          {status === "SUCCESS" && documentsQuery.data?.receipts?.length ? (
            <div className="rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm">
              <p className="font-semibold text-success">Payment complete — receipt generated</p>
              <a
                href={documentsQuery.data.receipts[0].public_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-primary underline-offset-2 hover:underline"
              >
                Download receipt ({documentsQuery.data.receipts[0].file_name})
              </a>
            </div>
          ) : null}

        <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr_340px]">
          <Panel className="h-fit">
            <PanelHeader title="Extended booking context" subtitle="Agent, email, and operational metadata" />
            <div className="space-y-2 p-4">
              <DetailBlock label="Lead / Customer" value={displayName} icon={User} />
              <DetailBlock label="Pickup" value={session.lead.pickup_location} icon={MapPin} />
              <DetailBlock label="Dropoff" value={session.lead.drop_location} icon={MapPin} />
              <DetailBlock
                label="Pickup Date"
                value={formatDateTime(session.lead.pickup_datetime)}
                icon={Calendar}
              />
              <DetailBlock
                label="Return Date"
                value={formatDateTime(session.lead.return_datetime)}
                icon={Calendar}
              />
              <DetailBlock label="Vehicle" value={vehicleLabel} icon={Car} />
              <DetailBlock
                label="Amount"
                value={formatMoney(session.amount, session.currency)}
                icon={Wallet}
              />
              <DetailBlock label="Agent" value={session.requested_by.name} icon={User} />
              {canViewSensitiveCustomerDetails(role) ? (
                <>
                  <DetailBlock label="Email" value={maskEmail(session.lead.customer_email, role)} />
                  <DetailBlock label="Phone" value={maskPhone(session.lead.customer_phone, role)} />
                </>
              ) : null}
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel>
              <PanelHeader title="Payment Details" subtitle="Gateway and session metadata" />
              <div className="grid gap-2 p-4 sm:grid-cols-2">
                <DetailBlock label="Gateway" value={session.gateway.name} />
                <DetailBlock label="Checkout mode" value={session.checkout_mode} />
                <DetailBlock label="Amount" value={formatMoney(session.amount, session.currency)} />
                <DetailBlock label="Session Status" value={session.status} />
                <DetailBlock label="Requested By" value={session.requested_by.name} />
                <DetailBlock label="Finance User" value={session.processed_by?.name ?? "Unassigned"} />
                <DetailBlock label="Expires" value={formatDateTime(session.expires_at)} />
                <DetailBlock label="Created" value={formatDateTime(session.created_at)} />
              </div>
              {session.failure_reason ? (
                <div className="mx-4 mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {session.failure_reason}
                </div>
              ) : null}
            </Panel>

            <Panel>
              <PanelHeader title="Payment Attempts" subtitle="Gateway order and capture history" />
              <PaymentAttemptHistory
                attempts={attemptsQuery.data ?? []}
                loading={attemptsQuery.isLoading}
              />
            </Panel>

            {auditQuery.data ? (
              <Panel>
                <PanelHeader title="Audit Timeline" subtitle="Session lifecycle events" />
                <div className="p-4">
                  <AuditTimeline logs={auditQuery.data} />
                </div>
              </Panel>
            ) : null}
          </div>

          <GatewayCheckoutPanel
            sessionId={sessionId}
            session={session}
            status={status}
            financeNotes={financeNotes}
            onFinanceNotesChange={setFinanceNotes}
            onInvalidate={invalidate}
          />
        </div>
        </div>
      ) : session ? (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-6 text-center text-sm text-warning">
          <AlertTriangle className="mx-auto mb-2 h-5 w-5" />
          Finance checkout access required.
        </div>
      ) : (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          Payment session not found or access denied.
        </div>
      )}
    </div>
  );
}
