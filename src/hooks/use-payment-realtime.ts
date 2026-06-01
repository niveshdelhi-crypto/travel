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

/** Invalidate only queue/metrics surfaces — avoid refetching entire payment console. */
function invalidateLivePaymentSurfaces(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: paymentQueryKeys.bookingRequests() });
  void queryClient.invalidateQueries({ queryKey: paymentQueryKeys.paymentSessionQueue() });
  void queryClient.invalidateQueries({ queryKey: paymentQueryKeys.paymentSessionMetrics() });
  void queryClient.invalidateQueries({ queryKey: paymentQueryKeys.transactions({}, 1) });
}

function invalidatePaymentSessionDetail(
  queryClient: ReturnType<typeof useQueryClient>,
  sessionId?: string,
) {
  if (!sessionId) return;
  void queryClient.invalidateQueries({ queryKey: paymentQueryKeys.paymentSessionDetail(sessionId) });
  void queryClient.invalidateQueries({ queryKey: paymentQueryKeys.checkoutConfig(sessionId) });
  void queryClient.invalidateQueries({ queryKey: paymentQueryKeys.paymentSessionAttempts(sessionId) });
}

export function usePaymentRealtime(activeSessionId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidateQueues = () => invalidateLivePaymentSurfaces(queryClient);
    const invalidateSession = (payload: PaymentSessionRealtimePayload) =>
      invalidatePaymentSessionDetail(queryClient, payload.id ?? activeSessionId);

    const disposers = [
      onSocketEvent(
        "PAYMENT_CREATED",
        dedupeHandler((_payload: PaymentRealtimePayload) => invalidateQueues()),
      ),
      onSocketEvent(
        "PAYMENT_SUCCESS",
        dedupeHandler((_payload: PaymentRealtimePayload) => invalidateQueues()),
      ),
      onSocketEvent(
        "PAYMENT_FAILED",
        dedupeHandler((_payload: PaymentRealtimePayload) => invalidateQueues()),
      ),
      onSocketEvent(
        "BOOKING_CONFIRMED",
        dedupeHandler((_payload: BookingConfirmedPayload) => invalidateQueues()),
      ),
      onSocketEvent(
        "PAYMENT_SESSION_CREATED",
        dedupeHandler((payload: PaymentSessionRealtimePayload) => {
          invalidateQueues();
          invalidateSession(payload);
        }),
      ),
      onSocketEvent(
        "FINANCE_PAYMENT_QUEUED",
        dedupeHandler((payload: PaymentSessionRealtimePayload) => {
          invalidateQueues();
          invalidateSession(payload);
        }),
      ),
      onSocketEvent(
        "PAYMENT_SESSION_PROCESSING",
        dedupeHandler((payload: PaymentSessionRealtimePayload) => {
          invalidateQueues();
          invalidateSession(payload);
        }),
      ),
      onSocketEvent(
        "PAYMENT_SESSION_SUCCESS",
        dedupeHandler((payload: PaymentSessionRealtimePayload) => {
          invalidateQueues();
          invalidateSession(payload);
        }),
      ),
      onSocketEvent(
        "PAYMENT_SESSION_FAILED",
        dedupeHandler((payload: PaymentSessionRealtimePayload) => {
          invalidateQueues();
          invalidateSession(payload);
        }),
      ),
      onSocketEvent(
        "PAYMENT_SESSION_CANCELLED",
        dedupeHandler((payload: PaymentSessionRealtimePayload) => {
          invalidateQueues();
          invalidateSession(payload);
        }),
      ),
    ];

    return () => disposers.forEach((dispose) => dispose());
  }, [queryClient, activeSessionId]);
}
