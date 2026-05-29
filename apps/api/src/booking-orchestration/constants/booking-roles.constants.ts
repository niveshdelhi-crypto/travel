import { UserRole } from "@prisma/client";

export const BOOKING_ADMIN_ROLES = [UserRole.admin] as const;

export const BOOKING_FINANCE_ROLES = [UserRole.admin, UserRole.finance_admin] as const;

export const BOOKING_OPERATIONS_ROLES = [
  UserRole.admin,
  UserRole.operations_manager,
] as const;

export const BOOKING_AGENT_ROLES = [
  UserRole.admin,
  UserRole.finance_admin,
  UserRole.operations_manager,
  UserRole.sales_agent,
] as const;

export function hasFinanceBookingAccess(role: UserRole): boolean {
  return role === UserRole.admin || role === UserRole.finance_admin;
}

export function hasOperationsAccess(role: UserRole): boolean {
  return role === UserRole.admin || role === UserRole.operations_manager;
}

export function canViewSensitiveTravelerData(role: UserRole): boolean {
  return role === UserRole.admin;
}
