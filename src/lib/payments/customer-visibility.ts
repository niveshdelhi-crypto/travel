import type { UserRole } from "@/types";

export function isRecurringCustomer(bookingCount: number): boolean {
  return bookingCount >= 2;
}

export function canViewSensitiveCustomerDetails(role: UserRole): boolean {
  return role === "admin" || role === "finance_admin";
}

export function canProcessPayments(role: UserRole): boolean {
  return role === "admin" || role === "finance_admin";
}

export function formatRecurringCustomerRef(travelerId: string): string {
  const suffix = travelerId.replace(/-/g, "").slice(0, 4).toUpperCase();
  return `Customer #RV${suffix}`;
}

export function maskEmail(email: string, role: UserRole): string {
  if (canViewSensitiveCustomerDetails(role)) return email;
  const [local, domain] = email.split("@");
  if (!domain) return "••••";
  const visible = local.slice(0, 2) || "••";
  return `${visible}***@${domain}`;
}

export function maskPhone(phone: string, role: UserRole): string {
  if (canViewSensitiveCustomerDetails(role)) return phone;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  const country = digits.length > 10 ? `+${digits.slice(0, 1)} ` : "";
  return `${country}******${digits.slice(-4)}`;
}

export function maskCustomerName(
  name: string,
  role: UserRole,
  options?: { isRecurring?: boolean; travelerId?: string },
): string {
  if (canViewSensitiveCustomerDetails(role)) return name;
  if (options?.isRecurring && options.travelerId) {
    return formatRecurringCustomerRef(options.travelerId);
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "Traveler";
  return `${parts[0]?.[0] ?? ""}. ${parts.length > 1 ? parts[parts.length - 1] : "•••"}`;
}
