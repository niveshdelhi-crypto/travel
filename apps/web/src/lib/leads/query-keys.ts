import type { LeadListParams } from "./types";

export const leadQueryKeys = {
  all: ["leads"] as const,
  lists: () => [...leadQueryKeys.all, "list"] as const,
  list: (params: Required<LeadListParams>) => [...leadQueryKeys.lists(), params] as const,
  metrics: () => [...leadQueryKeys.all, "metrics"] as const,
};
