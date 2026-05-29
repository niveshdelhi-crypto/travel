import { Injectable, NotFoundException } from "@nestjs/common";
import {
  AuditLogAction,
  BookingLifecycleStatus,
  SupplierBookingStatus,
} from "@prisma/client";
import { randomUUID } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogService } from "../../payments/services/audit-log.service";
import { BookingLifecycleService } from "./booking-lifecycle.service";

@Injectable()
export class SupplierBookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lifecycle: BookingLifecycleService,
    private readonly auditLog: AuditLogService,
  ) {}

  async listSuppliers() {
    return this.prisma.rentalSupplier.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { vehicles: true, supplier_bookings: true } },
      },
    });
  }

  async createManualSupplierBooking(
    bookingId: string,
    supplierId: string,
    actorId?: string,
    reference?: string,
  ) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException("Booking not found");

    const supplier = await this.prisma.rentalSupplier.findFirst({
      where: { id: supplierId, is_active: true },
    });
    if (!supplier) throw new NotFoundException("Supplier not found");

    const supplierBooking = await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { supplier_id: supplierId },
      });

      return tx.supplierBooking.create({
        data: {
          booking_id: bookingId,
          supplier_id: supplierId,
          status: SupplierBookingStatus.SUBMITTED,
          supplier_reference: reference ?? `MAN-${randomUUID().slice(0, 8).toUpperCase()}`,
        },
        include: { supplier: true },
      });
    });

    await this.lifecycle.transition(bookingId, BookingLifecycleStatus.SUPPLIER_BOOKING_PENDING, {
      actorId,
      payload: { supplierId, supplierBookingId: supplierBooking.id },
    });

    await this.auditLog.log({
      action: AuditLogAction.SUPPLIER_BOOKING_CREATED,
      resourceType: "supplier_booking",
      resourceId: supplierBooking.id,
      userId: actorId,
      metadata: { bookingId, supplierId },
    });

    return supplierBooking;
  }

  async confirmSupplierBooking(supplierBookingId: string, confirmationNumber: string, actorId?: string) {
    const record = await this.prisma.supplierBooking.update({
      where: { id: supplierBookingId },
      data: {
        status: SupplierBookingStatus.CONFIRMED,
        confirmation_number: confirmationNumber,
        synced_at: new Date(),
      },
    });

    await this.prisma.booking.update({
      where: { id: record.booking_id },
      data: { confirmation_reference: confirmationNumber },
    });

    await this.lifecycle.transition(record.booking_id, BookingLifecycleStatus.BOOKING_CONFIRMED, {
      actorId,
      payload: { confirmationNumber },
    });

    await this.auditLog.log({
      action: AuditLogAction.SUPPLIER_BOOKING_SYNCED,
      resourceType: "supplier_booking",
      resourceId: supplierBookingId,
      userId: actorId,
    });

    return record;
  }

  async listQueue() {
    return this.prisma.supplierBooking.findMany({
      where: {
        status: { in: [SupplierBookingStatus.PENDING, SupplierBookingStatus.SUBMITTED] },
      },
      orderBy: { created_at: "asc" },
      include: {
        booking: {
          select: {
            id: true,
            lifecycle_status: true,
            gross_revenue: true,
            currency: true,
            lead: { select: { customer_name: true, pickup_location: true } },
          },
        },
        supplier: { select: { id: true, name: true, slug: true } },
      },
    });
  }
}
