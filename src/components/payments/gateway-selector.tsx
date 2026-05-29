import { gatewayTypeLabel } from "@/lib/payments/gateway-labels";
import type { GatewayOption } from "@/lib/payments/gateway-labels";
import { ChevronDown } from "lucide-react";

type GatewaySelectorProps = {
  options: GatewayOption[];
  value: string;
  onChange: (gatewayId: string) => void;
  disabled?: boolean;
  className?: string;
};

export function GatewaySelector({
  options,
  value,
  onChange,
  disabled,
  className = "",
}: GatewaySelectorProps) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        disabled={disabled || options.length === 0}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-border bg-surface py-2 pl-3 pr-9 text-sm text-foreground outline-none ring-primary/30 transition focus:ring-2 disabled:opacity-50"
      >
        <option value="">Select gateway…</option>
        {options.map((option) => (
          <option key={option.id} value={option.id} disabled={!option.isActive}>
            {option.label}
            {!option.isActive ? " (inactive)" : ""} · {gatewayTypeLabel(option.type)}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export function GatewayFilterSelect({
  options,
  value,
  onChange,
}: {
  options: GatewayOption[];
  value: string | "ALL";
  onChange: (value: string | "ALL") => void;
}) {
  return (
    <div className="relative min-w-[160px]">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as string | "ALL")}
        className="w-full appearance-none rounded-lg border border-border bg-surface py-2 pl-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      >
        <option value="ALL">All gateways</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
