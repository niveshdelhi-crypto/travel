import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AuditLogAction,
  BookingLifecycleStatus,
  BookingJobType,
  StoredDocumentKind,
} from "@prisma/client";
import { createWriteStream, promises as fs } from "fs";
import { join } from "path";
import PDFDocument from "pdfkit";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogService } from "../../payments/services/audit-log.service";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { BookingLifecycleService } from "./booking-lifecycle.service";
import { DocumentStorageService } from "./document-storage.service";

@Injectable()
export class InvoiceVoucherService {
  private readonly logger = new Logger(InvoiceVoucherService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: DocumentStorageService,
    private readonly lifecycle: BookingLifecycleService,
    private readonly auditLog: AuditLogService,
    private readonly realtime: RealtimeGateway,
    private readonly config: ConfigService,
  ) {}

  private invoiceNumber(): string {
    return `INV-${Date.now().toString(36).toUpperCase()}`;
  }

  private voucherNumber(): string {
    return `VCH-${Date.now().toString(36).toUpperCase()}`;
  }

  async generateInvoice(bookingId: string, actorId?: string) {
    const booking = await this.prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: {
        lead: true,
        traveler: true,
      },
    });

    const invoiceNumber = this.invoiceNumber();
    const fileName = `${invoiceNumber}.pdf`;
    const { storageKey, publicUrl, byteSize } = await this.renderPdf({
      fileName,
      title: "Book my Carz — Tax Invoice",
      lines: [
        `Invoice: ${invoiceNumber}`,
        `Traveler: ${booking.traveler?.full_name ?? booking.lead.customer_name}`,
        `Route: ${booking.lead.pickup_location} → ${booking.lead.drop_location}`,
        `Amount: ${booking.gross_revenue} ${booking.currency}`,
        `Booking ref: ${booking.confirmation_reference ?? booking.id}`,
      ],
    });

    const invoice = await this.prisma.bookingInvoice.create({
      data: {
        booking_id: bookingId,
        invoice_number: invoiceNumber,
        amount: booking.gross_revenue,
        currency: booking.currency,
        pdf_url: publicUrl,
        storage_key: storageKey,
        metadata: { byteSize },
      },
    });

    await this.storage.record({
      kind: StoredDocumentKind.INVOICE,
      referenceId: invoice.id,
      fileName,
      storageKey,
      publicUrl,
      byteSize,
    });

    await this.auditLog.log({
      action: AuditLogAction.INVOICE_GENERATED,
      resourceType: "booking_invoice",
      resourceId: invoice.id,
      userId: actorId,
    });

    this.realtime.emitInvoiceGenerated({
      id: invoice.id,
      booking_id: bookingId,
      invoice_number: invoiceNumber,
      pdf_url: publicUrl,
    });

    return invoice;
  }

  async generateReceipt(bookingId: string, actorId?: string) {
    const booking = await this.prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { lead: true, traveler: true },
    });

    const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;
    const fileName = `${receiptNumber}.pdf`;
    const { storageKey, publicUrl, byteSize } = await this.renderPdf({
      fileName,
      title: "Book my Carz — Payment Receipt",
      lines: [
        `Receipt: ${receiptNumber}`,
        `Paid by: ${booking.traveler?.full_name ?? booking.lead.customer_name}`,
        `Route: ${booking.lead.pickup_location} → ${booking.lead.drop_location}`,
        `Amount paid: ${booking.gross_revenue} ${booking.currency}`,
        `Booking ref: ${booking.confirmation_reference ?? booking.id}`,
        `Payment date: ${new Date().toISOString()}`,
      ],
    });

    await this.storage.record({
      kind: StoredDocumentKind.RECEIPT,
      referenceId: bookingId,
      fileName,
      storageKey,
      publicUrl,
      byteSize,
    });

    await this.auditLog.log({
      action: AuditLogAction.INVOICE_GENERATED,
      resourceType: "booking",
      resourceId: bookingId,
      userId: actorId,
      metadata: { documentKind: "RECEIPT", receiptNumber, pdfUrl: publicUrl },
    });

    this.realtime.emitInvoiceGenerated({
      id: bookingId,
      booking_id: bookingId,
      invoice_number: receiptNumber,
      pdf_url: publicUrl,
    });

    return { receiptNumber, pdf_url: publicUrl, storage_key: storageKey };
  }

  async generateVoucher(bookingId: string, actorId?: string) {
    const booking = await this.prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { lead: true, traveler: true },
    });

    const voucherNumber = this.voucherNumber();
    const fileName = `${voucherNumber}.pdf`;
    const { storageKey, publicUrl, byteSize } = await this.renderPdf({
      fileName,
      title: "Book my Carz — Travel Voucher",
      lines: [
        `Voucher: ${voucherNumber}`,
        `Guest: ${booking.traveler?.full_name ?? booking.lead.customer_name}`,
        `Pickup: ${booking.lead.pickup_location}`,
        `Drop-off: ${booking.lead.drop_location}`,
        `Pickup date: ${booking.lead.pickup_datetime.toISOString()}`,
        `Confirmation: ${booking.confirmation_reference ?? "Pending"}`,
      ],
    });

    const voucher = await this.prisma.bookingVoucher.create({
      data: {
        booking_id: bookingId,
        voucher_number: voucherNumber,
        pdf_url: publicUrl,
        storage_key: storageKey,
        expires_at: booking.lead.return_datetime,
      },
    });

    await this.storage.record({
      kind: StoredDocumentKind.VOUCHER,
      referenceId: voucher.id,
      fileName,
      storageKey,
      publicUrl,
      byteSize,
    });

    await this.lifecycle.transition(bookingId, BookingLifecycleStatus.VOUCHER_GENERATED, {
      actorId,
      payload: { voucherNumber },
    });

    await this.auditLog.log({
      action: AuditLogAction.VOUCHER_GENERATED,
      resourceType: "booking_voucher",
      resourceId: voucher.id,
      userId: actorId,
    });

    this.realtime.emitVoucherGenerated({
      id: voucher.id,
      booking_id: bookingId,
      voucher_number: voucherNumber,
      pdf_url: publicUrl,
    });

    return voucher;
  }

  async listDocuments(bookingId: string) {
    const [invoices, vouchers, receipts] = await Promise.all([
      this.prisma.bookingInvoice.findMany({ where: { booking_id: bookingId } }),
      this.prisma.bookingVoucher.findMany({ where: { booking_id: bookingId } }),
      this.prisma.storedDocument.findMany({
        where: { kind: StoredDocumentKind.RECEIPT, reference_id: bookingId },
        orderBy: { created_at: "desc" },
      }),
    ]);
    return { invoices, vouchers, receipts };
  }

  private async renderPdf(input: {
    fileName: string;
    title: string;
    lines: string[];
  }): Promise<{ storageKey: string; publicUrl: string; byteSize: number }> {
    const uploadDir = this.config.get<string>("DOCUMENT_UPLOAD_DIR") ?? join(process.cwd(), "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const storageKey = `documents/${Date.now()}-${input.fileName}`;
    const absolutePath = join(uploadDir, input.fileName);

    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = createWriteStream(absolutePath);
      doc.pipe(stream);
      doc.fontSize(20).fillColor("#172033").text(input.title, { align: "center" });
      doc.moveDown();
      doc.fontSize(11).fillColor("#36445a");
      for (const line of input.lines) {
        doc.text(line);
        doc.moveDown(0.4);
      }
      doc.moveDown();
      doc.fontSize(9).fillColor("#637083").text("Book my Carz — Premium Travel Operations", {
        align: "center",
      });
      doc.end();
      stream.on("finish", () => resolve());
      stream.on("error", reject);
    });

    const stat = await fs.stat(absolutePath);
    const stored = await this.storage.storeLocalFile(absolutePath, storageKey, input.fileName);

    return {
      storageKey: stored.storageKey,
      publicUrl: stored.publicUrl,
      byteSize: stat.size,
    };
  }
}
