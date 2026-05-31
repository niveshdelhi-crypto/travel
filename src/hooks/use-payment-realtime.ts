import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { onSocketEvent } from "@/services/socket";
import { paymentQueryKeys } from "@/lib/payments/query-keys";
import type {
  BookingConfirmedPayload,
  PaymentRealtimePayload,
  PaymentSessionRealtimePayload,
} from "@/types/payments-orchestration";

const seenEventIds = new Set<string>();
const MAX_SEEN = 500;

function dedupeHandler<T extends { _realtime?: { eventId?: string } }>(
  handler: (payload: T) => void,
) {
  return (payload: T) => {
    const eventId = payload._realtime?.eventId;
    if (eventId) {
      if (seenEventIds.has(eventId)) return;
      seenEventIds.add(eventId);
      if (seenEventIds.size > MAX_SEEN) {
        const first = seenEventIds.values().next().value;
        if (first) seenEventIds.delete(first);
      }
    }
    handler(payload);
  };
}

function invalidatePaymentQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: paymentQueryKeys.root });
}

export function usePaymentRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidate = () => invalidatePaymentQueries(queryClient);

    const disposers = [
      onSocketEvent(
        "PAYMENT_CREATED",
        dedupeHandler((_payload: PaymentRealtimePayload) => invalidate()),
      ),
      onSocketEvent(
        "PAYMENT_SUCCESS",
        dedupeHandler((_payload: PaymentRealtimePayload) => invalidate()),
      ),
      onSocketEvent(
        "PAYMENT_FAILED",
        dedupeHandler((_payload: PaymentRealtimePayload) => invalidate()),
      ),
      onSocketEvent(
        "BOOKING_CONFIRMED",
        dedupeHandler((_payload: BookingConfirmedPayload) => invalidate()),
      ),
      onSocketEvent(
        "PAYMENT_SESSION_CREATED",
        dedupeHandler((_payload: PaymentSessionRealtimePayload) => invalidate()),
      ),
      onSocketEvent(
        "FINANCE_PAYMENT_QUEUED",
        dedupeHandler((_payload: PaymentSessionRealtimePayload) => invalidate()),
      ),
      onSocketEvent(
        "PAYMENT_SESSION_PROCESSING",
        dedupeHandler((_payload: PaymentSessionRealtimePayload) => invalidate()),
      ),
      onSocketEvent(
        "PAYMENT_SESSION_SUCCESS",
        dedupeHandler((_payload: PaymentSessionRealtimePayload) => invalidate()),
      ),
      onSocketEvent(
        "PAYMENT_SESSION_FAILED",
        dedupeHandler((_payload: PaymentSessionRealtimePayload) => invalidate()),
      ),
      onSocketEvent(
        "PAYMENT_SESSION_CANCELLED",
        dedupeHandler((_payload: PaymentSessionRealtimePayload) => invalidate()),
      ),
    ];

    return () => disposers.forEach((dispose) => dispose());
  }, [queryClient]);
}
