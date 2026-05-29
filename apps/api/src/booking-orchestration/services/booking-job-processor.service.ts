import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { BookingJobStatus, BookingJobType, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { InvoiceVoucherService } from "./invoice-voucher.service";
import { SupplierBookingService } from "./supplier-booking.service";

@Injectable()
export class BookingJobProcessorService implements OnModuleInit {
  private readonly logger = new Logger(BookingJobProcessorService.name);
  private interval?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly invoices: InvoiceVoucherService,
    private readonly suppliers: SupplierBookingService,
  ) {}

  onModuleInit() {
    this.interval = setInterval(() => void this.processPendingJobs(), 10_000);
  }

  onModuleDestroy() {
    if (this.interval) clearInterval(this.interval);
  }

  async enqueue(bookingId: string, jobType: BookingJobType, payload?: Record<string, unknown>) {
    const idempotencyKey = `job-${jobType}-${bookingId}-${randomUUID()}`;
    return this.prisma.bookingBackgroundJob.create({
      data: {
        booking_id: bookingId,
        job_type: jobType,
        idempotency_key: idempotencyKey,
        payload: (payload ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  private async processPendingJobs() {
    const jobs = await this.prisma.bookingBackgroundJob.findMany({
      where: {
        status: BookingJobStatus.PENDING,
        scheduled_for: { lte: new Date() },
      },
      take: 10,
      orderBy: { scheduled_for: "asc" },
    });

    for (const job of jobs) {
      await this.processJob(job.id);
    }
  }

  private async processJob(jobId: string) {
    const job = await this.prisma.bookingBackgroundJob.findUnique({ where: { id: jobId } });
    if (!job || job.status !== BookingJobStatus.PENDING) return;

    await this.prisma.bookingBackgroundJob.update({
      where: { id: jobId },
      data: { status: BookingJobStatus.PROCESSING, attempts: { increment: 1 } },
    });

    try {
      switch (job.job_type) {
        case BookingJobType.GENERATE_INVOICE:
          await this.invoices.generateInvoice(job.booking_id);
          break;
        case BookingJobType.GENERATE_VOUCHER:
          await this.invoices.generateVoucher(job.booking_id);
          break;
        case BookingJobType.SUPPLIER_SYNC: {
          const payload = job.payload as { supplierId?: string; reference?: string } | null;
          if (payload?.supplierId) {
            await this.suppliers.createManualSupplierBooking(
              job.booking_id,
              payload.supplierId,
              undefined,
              payload.reference,
            );
          }
          break;
        }
        default:
          this.logger.warn(JSON.stringify({ message: "job.unhandled", jobType: job.job_type }));
      }

      await this.prisma.bookingBackgroundJob.update({
        where: { id: jobId },
        data: { status: BookingJobStatus.COMPLETED, completed_at: new Date() },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const attempts = job.attempts + 1;
      await this.prisma.bookingBackgroundJob.update({
        where: { id: jobId },
        data: {
          status: attempts >= job.max_attempts ? BookingJobStatus.FAILED : BookingJobStatus.PENDING,
          last_error: message,
          scheduled_for: new Date(Date.now() + attempts * 30_000),
        },
      });
      this.logger.error(JSON.stringify({ message: "job.failed", jobId, error: message }));
    }
  }
}
