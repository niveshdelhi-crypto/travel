import { UserRole } from "@prisma/client";

export const PAYMENT_ADMIN_ROLES = [UserRole.admin, UserRole.finance_admin] as const;

/** PayPal testing console — production admins only */
export const PAYMENT_TESTING_ROLES = [UserRole.admin] as const;

export const PAYMENT_READ_ROLES = [
  UserRole.admin,
  UserRole.finance_admin,
  UserRole.sales_agent,
] as const;

export const PAYMENT_PROCESS_ROLES = [UserRole.admin, UserRole.finance_admin] as const;

export function hasFinanceAccess(role: UserRole): boolean {
  return role === UserRole.admin || role === UserRole.finance_admin;
}
