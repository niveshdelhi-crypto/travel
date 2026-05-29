import type { PaymentGatewayRow } from "@/types/payments-orchestration";

export type GatewayOption = {
  id: string;
  label: string;
  type: PaymentGatewayRow["type"];
  isActive: boolean;
};

const PREFERRED_LABELS: Array<{
  label: string;
  type: PaymentGatewayRow["type"];
  namePattern: RegExp;
}> = [
  { label: "PayPal USA", type: "paypal", namePattern: /usa|primary|main/i },
  { label: "PayPal Backup", type: "paypal", namePattern: /backup|secondary|failover/i },
  { label: "Stripe", type: "stripe", namePattern: /./ },
  { label: "Wise", type: "wise", namePattern: /./ },
];

export function buildGatewayOptions(gateways: PaymentGatewayRow[]): GatewayOption[] {
  const used = new Set<string>();
  const options: GatewayOption[] = [];

  for (const preferred of PREFERRED_LABELS) {
    const match = gateways.find(
      (g) =>
        g.type === preferred.type &&
        !used.has(g.id) &&
        (preferred.label === "Stripe" || preferred.label === "Wise"
          ? g.type === preferred.type
          : preferred.namePattern.test(g.name)),
    );

    if (match) {
      used.add(match.id);
      options.push({
        id: match.id,
        label: preferred.label,
        type: match.type,
        isActive: match.is_active,
      });
    }
  }

  for (const gateway of gateways) {
    if (used.has(gateway.id)) continue;
    options.push({
      id: gateway.id,
      label: gateway.name,
      type: gateway.type,
      isActive: gateway.is_active,
    });
  }

  return options;
}

export function gatewayTypeLabel(type: PaymentGatewayRow["type"]): string {
  switch (type) {
    case "stripe":
      return "Stripe";
    case "paypal":
      return "PayPal";
    case "wise":
      return "Wise";
    default:
      return type;
  }
}
