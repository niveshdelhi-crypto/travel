import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { onSocketEvent } from "@/services/socket";
import { bookingOrchestrationService } from "@/services/booking-orchestration.service";

export const bookingOpsQueryKeys = {
  root: ["booking-operations"] as const,
  queue: () => [...bookingOpsQueryKeys.root, "queue"] as const,
  finance: () => [...bookingOpsQueryKeys.root, "finance"] as const,
  refunds: () => [...bookingOpsQueryKeys.root, "refunds"] as const,
  suppliers: () => [...bookingOpsQueryKeys.root, "suppliers"] as const,
  travelers: (filters: Record<string, unknown>) =>
    [...bookingOpsQueryKeys.root, "travelers", filters] as const,
};

export function useBookingOperationsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidate = () =>
      void queryClient.invalidateQueries({ queryKey: bookingOpsQueryKeys.root });

    const events = [
      "BOOKING_CREATED",
      "BOOKING_CONFIRMED",
      "BOOKING_FAILED",
      "INVOICE_GENERATED",
      "VOUCHER_GENERATED",
      "REFUND_CREATED",
      "REFUND_COMPLETED",
      "PAYMENT_SUCCESS",
    ] as const;

    const disposers = events.map((event) => onSocketEvent(event, invalidate));
    return () => disposers.forEach((d) => d());
  }, [queryClient]);
}

export function useBookingOperationsQueue() {
  return useQuery({
    queryKey: bookingOpsQueryKeys.queue(),
    queryFn: () => bookingOrchestrationService.listQueue({ page: 1, pageSize: 50 }),
  });
}

export function useFinanceOverview() {
  return useQuery({
    queryKey: bookingOpsQueryKeys.finance(),
    queryFn: () => bookingOrchestrationService.financeOverview(),
  });
}
