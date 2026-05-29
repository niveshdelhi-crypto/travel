import { GatewayFilterSelect } from "@/components/payments/gateway-selector";
import type { GatewayOption } from "@/lib/payments/gateway-labels";
import type { LeadMetrics } from "@/services";
import type { OrchestrationPaymentStatus, PaymentConsoleFilters } from "@/types/payments-orchestration";
import { Filter, Repeat2, UserRound } from "lucide-react";

const STATUS_OPTIONS: Array<{ value: PaymentConsoleFilters["status"]; label: string }> = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SUCCESS", label: "Successful" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

type PaymentFiltersBarProps = {
  filters: PaymentConsoleFilters;
  onChange: (patch: Partial<PaymentConsoleFilters>) => void;
  gatewayOptions: GatewayOption[];
  agents: LeadMetrics["activeAgents"];
};

export function PaymentFiltersBar({
  filters,
  onChange,
  gatewayOptions,
  agents,
}: PaymentFiltersBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 sm:flex-row sm:flex-wrap sm:items-center sm:p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Filter className="h-3.5 w-3.5" />
        Filters
      </div>

      <div className="relative min-w-[140px] flex-1 sm:max-w-[180px]">
        <UserRound className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <select
          value={filters.agentId}
          onChange={(e) => onChange({ agentId: e.target.value as PaymentConsoleFilters["agentId"] })}
          className="w-full appearance-none rounded-lg border border-border bg-surface py-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="ALL">All agents</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>

      <select
        value={filters.status}
        onChange={(e) =>
          onChange({ status: e.target.value as PaymentConsoleFilters["status"] })
        }
        className="min-w-[140px] flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 sm:max-w-[180px]"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <GatewayFilterSelect
        options={gatewayOptions}
        value={filters.gatewayId}
        onChange={(gatewayId) => onChange({ gatewayId: gatewayId as PaymentConsoleFilters["gatewayId"] })}
      />

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
        <input
          type="checkbox"
          checked={filters.recurringOnly}
          onChange={(e) => onChange({ recurringOnly: e.target.checked })}
          className="rounded border-border text-primary focus:ring-primary/30"
        />
        <Repeat2 className="h-3.5 w-3.5 text-muted-foreground" />
        Recurring only
      </label>
    </div>
  );
}
