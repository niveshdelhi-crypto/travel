export const crmQueryKeys = {
  bookings: (page: number, pageSize: number) => ["bookings", { page, pageSize }] as const,
  payments: (page: number, pageSize: number) => ["payments", { page, pageSize }] as const,
  pipeline: (scope: "admin" | "my") => ["leads", "pipeline", scope] as const,
};
