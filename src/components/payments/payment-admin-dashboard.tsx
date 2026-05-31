import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  EmptyState,
  MetricWidget,
  Panel,
  PanelHeader,
  Skeleton,
  StatCard,
} from "@/components/app/primitives";
import { AuditTimeline } from "@/components/payments/audit-timeline";
import { PaymentGatewayHealthPanel } from "@/components/payments/payment-gateway-health-panel";
import { BookingQueuePanel } from "@/components/payments/booking-queue-panel";
import { PaymentFiltersBar } from "@/components/payments/payment-filters-bar";
import { RecurringCustomerBadge } from "@/components/payments/recurring-customer-badge";
import {
  SensitiveCustomerPanel,
  type CustomerSensitiveProfile,
} from "@/components/payments/sensitive-customer-panel";
import { TransactionProcessModal } from "@/components/payments/transaction-process-modal";
import { usePaymentRealtime } from "@/hooks/use-payment-realtime";
import { canProcessPayments } from "@/lib/payments/customer-visibility";
import { buildGatewayOptions } from "@/lib/payments/gateway-labels";
import { formatDateTime, formatMoney, statusTone } from "@/lib/payments/format";
import { paymentQueryKeys } from "@/lib/payments/query-keys";
import {
  bookingsService,
  leadsService,
  paymentsOrchestrationService,
} from "@/services";
import { getSocketStatus } from "@/services/socket";
import { useAuthStore } from "@/store/auth.store";
import type {
  PaymentConsoleFilters,
  PaymentTransactionRow,
} from "@/types/payments-orchestration";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Radio,
  RefreshCw,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

const DEFAULT_FILTERS: PaymentConsoleFilters = {
  status: "ALL",
  gatewayId: "ALL",
  agentId: "ALL",
  recurringOnly: false,
};

export function PaymentAdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? "sales_agent";
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<PaymentConsoleFilters>(DEFAULT_FILTERS);
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransactionRow | null>(null);
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalGatewayId, setModalGatewayId] = useState("");
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  usePaymentRealtime();

  const gatewaysQuery = useQuery({
    queryKey: paymentQueryKeys.gateways(),
    queryFn: () => paymentsOrchestrationService.listGateways(),
    enabled: Boolean(user),
  });

  const gatewayHealthQuery = useQuery({
    queryKey: paymentQueryKeys.paymentsGatewayHealth(),
    queryFn: () => paymentsOrchestrationService.getGatewayHealth(),
    enabled: Boolean(user),
    refetchInterval: 120_000,
  });

  const transactionsQuery = useQuery({
    queryKey: paymentQueryKeys.transactions(filters, 1),
    queryFn: () =>
      paymentsOrchestrationService.listTransactions({
        page: 1,
        pageSize: 50,
        status: filters.status === "ALL" ? undefined : filters.status,
      }),
    enabled: Boolean(user),
  });

  const bookingRequestsQuery = useQuery({
    queryKey: paymentQueryKeys.bookingRequests(),
    queryFn: () => paymentsOrchestrationService.listBookingRequests({ page: 1, pageSize: 100 }),
    enabled: Boolean(user),
  });

  const auditQuery = useQuery({
    queryKey: paymentQueryKeys.auditLogs(),
    queryFn: () => paymentsOrchestrationService.listAuditLogs({ page: 1, pageSize: 30 }),
    enabled: Boolean(user),
  });

  const bookingsIndexQuery = useQuery({
    queryKey: paymentQueryKeys.bookingsIndex(),
    queryFn: () => bookingsService.list({ page: 1, pageSize: 200 }),
    enabled: Boolean(user),
  });

  const leadsIndexQuery = useQuery({
    queryKey: [...paymentQueryKeys.root, "leads-index"] as const,
    queryFn: () => leadsService.admin({ page: 1, pageSize: 200 }),
    enabled: Boolean(user),
  });

  const agentsQuery = useQuery({
    queryKey: paymentQueryKeys.agents(),
    queryFn: () => leadsService.metrics(),
    enabled: Boolean(user),
  });

  const gatewayOptions = useMemo(
    () => buildGatewayOptions(gatewaysQuery.data ?? []),
    [gatewaysQuery.data],
  );

  const customerIndex = useMemo(() => {
    const byEmail = new Map<string, { email: string; phone: string; name: string; count: number }>();
    const byLeadId = new Map<string, string>();
    const agentNames = new Map(
      (agentsQuery.data?.activeAgents ?? []).map((a) => [a.id, a.name] as const),
    );
    const phoneByLeadId = new Map(
      (leadsIndexQuery.data?.data ?? []).map((lead) => [lead.id, lead.customer_phone] as const),
    );

    for (const booking of bookingsIndexQuery.data?.data ?? []) {
      const email = booking.lead.customer_email.toLowerCase();
      byLeadId.set(booking.lead.id, email);
      const existing = byEmail.get(email);
      byEmail.set(email, {
        email: booking.lead.customer_email,
        phone: phoneByLeadId.get(booking.lead.id) ?? existing?.phone ?? "",
        name: booking.lead.customer_name,
        count: (existing?.count ?? 0) + 1,
      });
    }

    return { byEmail, byLeadId, agentNames };
  }, [bookingsIndexQuery.data, agentsQuery.data, leadsIndexQuery.data]);

  const recurringByLeadId = useMemo(() => {
    const map = new Map<string, number>();
    for (const booking of bookingsIndexQuery.data?.data ?? []) {
      const email = booking.lead.customer_email.toLowerCase();
      const count = customerIndex.byEmail.get(email)?.count ?? 1;
      map.set(booking.lead.id, count);
    }
    return map;
  }, [bookingsIndexQuery.data, customerIndex.byEmail]);

  const filteredTransactions = useMemo(() => {
    let rows = transactionsQuery.data?.data ?? [];

    if (filters.gatewayId !== "ALL") {
      rows = rows.filter((row) => row.gateway_id === filters.gatewayId);
    }

    if (filters.agentId !== "ALL") {
      rows = rows.filter((row) => row.booking.lead.assigned_to === filters.agentId);
    }

    if (filters.recurringOnly) {
      rows = rows.filter((row) => (recurringByLeadId.get(row.booking.lead_id) ?? 0) >= 2);
    }

    return rows;
  }, [transactionsQuery.data, filters, recurringByLeadId]);

  const stats = useMemo(() => {
    const all = transactionsQuery.data?.data ?? [];
    const pending = all.filter((t) => t.status === "PENDING").length;
    const success = all.filter((t) => t.status === "SUCCESS").length;
    const failed = all.filter((t) => t.status === "FAILED").length;
    const recurringCustomers = [...customerIndex.byEmail.values()].filter((c) => c.count >= 2).length;

    const gatewayTotals = new Map<string, { label: string; success: number; failed: number; volume: number }>();
    for (const row of all) {
      const key = row.gateway_id;
      const label = row.gateway.name;
      const entry = gatewayTotals.get(key) ?? { label, success: 0, failed: 0, volume: 0 };
      entry.volume += Number(row.amount);
      if (row.status === "SUCCESS") entry.success += 1;
      if (row.status === "FAILED") entry.failed += 1;
      gatewayTotals.set(key, entry);
    }

    return { pending, success, failed, recurringCustomers, gatewayTotals: [...gatewayTotals.values()] };
  }, [transactionsQuery.data, customerIndex.byEmail]);

  const selectedCustomer = useMemo((): CustomerSensitiveProfile | null => {
    const leadId =
      selectedTransaction?.booking.lead_id ??
      bookingRequestsQuery.data?.data.find((r) => r.id === selectedQueueId)?.booking.lead_id;

    if (!leadId) return null;

    const emailKey = customerIndex.byLeadId.get(leadId);
    if (!emailKey) return null;

    const profile = customerIndex.byEmail.get(emailKey);
    if (!profile) return null;

    const assignedTo =
      selectedTransaction?.booking.lead.assigned_to ??
      bookingRequestsQuery.data?.data.find((r) => r.id === selectedQueueId)?.booking.lead
        .assigned_to ??
      null;

    return {
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      bookingCount: profile.count,
      agentName: assignedTo ? customerIndex.agentNames.get(assignedTo) : undefined,
    };
  }, [
    selectedTransaction,
    selectedQueueId,
    bookingRequestsQuery.data,
    customerIndex,
  ]);

  const processTransactionMutation = useMutation({
    mutationFn: (id: string) => paymentsOrchestrationService.processTransaction(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: paymentQueryKeys.root }),
  });

  const captureTransactionMutation = useMutation({
    mutationFn: (id: string) => paymentsOrchestrationService.captureTransaction(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: paymentQueryKeys.root }),
  });

  const refundTransactionMutation = useMutation({
    mutationFn: (id: string) => paymentsOrchestrationService.refundTransaction(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentQueryKeys.root });
      setModalOpen(false);
    },
  });

  const processRequestMutation = useMutation({
    mutationFn: (id: string) => paymentsOrchestrationService.processBookingRequest(id),
    onMutate: (id) => setProcessingRequestId(id),
    onSettled: () => setProcessingRequestId(null),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: paymentQueryKeys.root }),
  });

  const isModalBusy =
    processTransactionMutation.isPending ||
    captureTransactionMutation.isPending ||
    refundTransactionMutation.isPending;

  const socketStatus = getSocketStatus();

  if (!user) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Sign in required"
        description="Authenticate as an administrator or finance admin to access the payment console."
      />
    );
  }

  return (
    <div className="space-y-4 p-3 sm:space-y-6 sm:p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Payment orchestration
          </p>
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Admin payment console</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Radio
            className={`h-3.5 w-3.5 ${socketStatus === "connected" ? "text-success" : "text-warning"}`}
          />
          Realtime {socketStatus}
        </div>
      </div>

      {gatewaysQuery.isError ? (
        <Panel>
          <p className="p-4 text-sm text-destructive">
            Could not load payment gateways. Ensure the API is running and you are signed in as admin or
            finance.
          </p>
        </Panel>
      ) : null}

      {!gatewaysQuery.isLoading && gatewayOptions.length === 0 ? (
        <Panel>
          <div className="space-y-2 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">No payment gateways configured</p>
            <p>
              Gateways are stored in the database and are not created automatically on first login. Seed
              demo providers (Stripe, PayPal, Wise) for local development:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted/50 p-3 font-mono text-xs text-foreground">
              cd apps/api{"\n"}npx prisma db seed
            </pre>
            <p>
              Then replace placeholder credentials via{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">POST /api/payments/gateways</code> or
              update rows in the <code className="rounded bg-muted px-1 py-0.5 text-xs">payment_gateways</code>{" "}
              table.
            </p>
          </div>
        </Panel>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Pending" value={String(stats.pending)} icon={Clock} trend="down" />
        <StatCard label="Successful" value={String(stats.success)} icon={CheckCircle2} trend="up" />
        <StatCard label="Failed" value={String(stats.failed)} icon={XCircle} trend="down" />
        <StatCard label="Recurring customers" value={String(stats.recurringCustomers)} icon={Users} />
        <StatCard label="Gateways active" value={String(gatewayOptions.filter((g) => g.isActive).length)} icon={Wallet} />
      </div>

      <PaymentGatewayHealthPanel
        rows={gatewayHealthQuery.data?.data ?? []}
        loading={gatewayHealthQuery.isLoading}
        checkedAt={gatewayHealthQuery.data?.checked_at}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHeader title="Gateway analytics" subtitle="Volume and outcome by configured provider" />
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {stats.gatewayTotals.length === 0 ? (
              <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
                No gateway activity yet.
              </p>
            ) : (
              stats.gatewayTotals.map((gateway) => (
                <MetricWidget
                  key={gateway.label}
                  label={gateway.label}
                  value={formatMoney(gateway.volume, "USD")}
                  sub={`${gateway.success} success · ${gateway.failed} failed`}
                  tone={gateway.failed > gateway.success ? "danger" : "success"}
                />
              ))
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Audit timeline" subtitle="Recent payment orchestration events" />
          <AuditTimeline logs={auditQuery.data?.data ?? []} isLoading={auditQuery.isLoading} />
        </Panel>
      </div>

      <PaymentFiltersBar
        filters={filters}
        onChange={(patch) => {
          setFilters((prev) => ({ ...prev, ...patch }));
        }}
        gatewayOptions={gatewayOptions}
        agents={agentsQuery.data?.activeAgents ?? []}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4">
          <BookingQueuePanel
            requests={bookingRequestsQuery.data?.data ?? []}
            isLoading={bookingRequestsQuery.isLoading}
            recurringByLeadId={recurringByLeadId}
            selectedId={selectedQueueId}
            onSelect={(request) => {
              setSelectedQueueId(request.id);
              setSelectedTransaction(null);
            }}
            onProcess={(request) => processRequestMutation.mutate(request.id)}
            canProcess={canProcessPayments(role)}
            isProcessingId={processingRequestId}
          />

          <Panel>
            <PanelHeader
              title="Transactions"
              subtitle={`${filteredTransactions.length} matching rows`}
              right={
                <button
                  type="button"
                  onClick={() => void queryClient.invalidateQueries({ queryKey: paymentQueryKeys.root })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </button>
              }
            />

            {transactionsQuery.isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !filteredTransactions.length ? (
              <EmptyState title="No transactions" description="Adjust filters or process the booking queue." />
            ) : (
              <div className="overflow-x-auto scrollbar-thin">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3">Traveler</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Gateway</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Agent</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((row) => {
                      const recurring = recurringByLeadId.get(row.booking.lead_id) ?? 1;
                      const agentName = row.booking.lead.assigned_to
                        ? customerIndex.agentNames.get(row.booking.lead.assigned_to)
                        : "—";
                      return (
                        <tr
                          key={row.id}
                          className="border-b border-border/80 hover:bg-muted/20"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                            {formatDateTime(row.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{row.booking.lead.customer_name}</span>
                              <RecurringCustomerBadge count={recurring} />
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums">
                            {formatMoney(row.amount, row.currency)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{row.gateway.name}</td>
                          <td className="px-4 py-3">
                            <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{agentName}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTransaction(row);
                                setSelectedQueueId(null);
                                setModalGatewayId(row.gateway_id);
                                setModalOpen(true);
                              }}
                              className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-accent"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        <SensitiveCustomerPanel customer={selectedCustomer} role={role} />
      </div>

      <TransactionProcessModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        transaction={selectedTransaction}
        gatewayOptions={gatewayOptions}
        selectedGatewayId={modalGatewayId}
        onGatewayChange={setModalGatewayId}
        role={role}
        isProcessing={isModalBusy}
        onProcess={() => selectedTransaction && processTransactionMutation.mutate(selectedTransaction.id)}
        onCapture={() => selectedTransaction && captureTransactionMutation.mutate(selectedTransaction.id)}
        onRefund={() => selectedTransaction && refundTransactionMutation.mutate(selectedTransaction.id)}
      />
    </div>
  );
}
