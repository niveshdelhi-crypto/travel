import { BookingLifecycleStatus } from "@prisma/client";

export const BOOKING_LIFECYCLE_TRANSITIONS: Record<
  BookingLifecycleStatus,
  BookingLifecycleStatus[]
> = {
  [BookingLifecycleStatus.BOOKING_REQUESTED]: [
    BookingLifecycleStatus.PAYMENT_PENDING,
    BookingLifecycleStatus.CANCELLED,
  ],
  [BookingLifecycleStatus.PAYMENT_PENDING]: [
    BookingLifecycleStatus.PAYMENT_PROCESSING,
    BookingLifecycleStatus.PAYMENT_FAILED,
    BookingLifecycleStatus.CANCELLED,
  ],
  [BookingLifecycleStatus.PAYMENT_PROCESSING]: [
    BookingLifecycleStatus.PAYMENT_SUCCESS,
    BookingLifecycleStatus.PAYMENT_FAILED,
  ],
  [BookingLifecycleStatus.PAYMENT_SUCCESS]: [
    BookingLifecycleStatus.SUPPLIER_BOOKING_PENDING,
    BookingLifecycleStatus.REFUND_PENDING,
  ],
  [BookingLifecycleStatus.SUPPLIER_BOOKING_PENDING]: [
    BookingLifecycleStatus.BOOKING_CONFIRMED,
    BookingLifecycleStatus.BOOKING_FAILED,
  ],
  [BookingLifecycleStatus.BOOKING_CONFIRMED]: [
    BookingLifecycleStatus.VOUCHER_GENERATED,
    BookingLifecycleStatus.REFUND_PENDING,
  ],
  [BookingLifecycleStatus.VOUCHER_GENERATED]: [
    BookingLifecycleStatus.CUSTOMER_NOTIFIED,
  ],
  [BookingLifecycleStatus.CUSTOMER_NOTIFIED]: [BookingLifecycleStatus.COMPLETED],
  [BookingLifecycleStatus.COMPLETED]: [BookingLifecycleStatus.REFUND_PENDING],
  [BookingLifecycleStatus.PAYMENT_FAILED]: [
    BookingLifecycleStatus.PAYMENT_PENDING,
    BookingLifecycleStatus.CANCELLED,
  ],
  [BookingLifecycleStatus.BOOKING_FAILED]: [
    BookingLifecycleStatus.SUPPLIER_BOOKING_PENDING,
    BookingLifecycleStatus.REFUND_PENDING,
    BookingLifecycleStatus.CANCELLED,
  ],
  [BookingLifecycleStatus.REFUND_PENDING]: [
    BookingLifecycleStatus.REFUNDED,
    BookingLifecycleStatus.CHARGEBACK,
  ],
  [BookingLifecycleStatus.REFUNDED]: [BookingLifecycleStatus.CHARGEBACK],
  [BookingLifecycleStatus.CHARGEBACK]: [],
  [BookingLifecycleStatus.CANCELLED]: [],
};

export const BOOKING_STATUS_MAP: Partial<Record<BookingLifecycleStatus, string>> = {
  [BookingLifecycleStatus.BOOKING_CONFIRMED]: "CONFIRMED",
  [BookingLifecycleStatus.COMPLETED]: "COMPLETED",
  [BookingLifecycleStatus.CANCELLED]: "CANCELLED",
  [BookingLifecycleStatus.PAYMENT_PENDING]: "PAYMENT_PENDING",
};
