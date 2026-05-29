import type { UserRole } from "@/types";

export function isRecurringCustomer(bookingCount: number): boolean {
  return bookingCount >= 2;
}

export function maskEmail(email: string, role: UserRole): string {
  if (role === "admin") return email;
  const [local, domain] = email.split("@");
  if (!domain) return "••••";
  const visible = local.slice(0, 1) || "•";
  return `${visible}•••@${domain}`;
}

export function maskPhone(phone: string, role: UserRole): string {
  if (role === "admin") return phone;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  return `••• ••• ${digits.slice(-4)}`;
}

export function maskCustomerName(name: string, role: UserRole): string {
  if (role === "admin" || role === "finance_admin") return name;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "Traveler";
  return `${parts[0]?.[0] ?? ""}. ${parts.length > 1 ? parts[parts.length - 1] : "•••"}`;
}

export function canViewSensitiveCustomerDetails(role: UserRole): boolean {
  return role === "admin";
}

export function canProcessPayments(role: UserRole): boolean {
  return role === "admin" || role === "finance_admin";
}
