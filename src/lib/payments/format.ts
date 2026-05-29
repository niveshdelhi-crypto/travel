export function formatMoney(amount: string | number, currency: string) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.length === 3 ? currency : "USD",
    }).format(n);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function statusTone(
  status: string,
): "neutral" | "success" | "warning" | "danger" | "info" | "primary" {
  switch (status) {
    case "SUCCESS":
    case "COMPLETED":
    case "CONFIRMED":
      return "success";
    case "PROCESSING":
    case "PAYMENT_PENDING":
      return "info";
    case "PENDING":
      return "warning";
    case "FAILED":
    case "CANCELLED":
      return "danger";
    case "REFUNDED":
      return "neutral";
    default:
      return "neutral";
  }
}
