import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { UserRole } from "@prisma/client";
import type { AuthenticatedUser } from "../../auth/types/authenticated-user";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import {
  BOOKING_AGENT_ROLES,
  BOOKING_FINANCE_ROLES,
  BOOKING_OPERATIONS_ROLES,
} from "../constants/booking-roles.constants";
import {
  ConfirmSupplierBookingDto,
  CreateRefundRequestDto,
  InitiateBookingDto,
  StoreVaultEntryDto,
} from "../dto/booking-orchestration.dto";
import { BookingOrchestrationService } from "../services/booking-orchestration.service";
import { BookingLifecycleService } from "../services/booking-lifecycle.service";
import { FinanceDashboardService } from "../services/finance-dashboard.service";
import { InvoiceVoucherService } from "../services/invoice-voucher.service";
import { RefundWorkflowService } from "../services/refund-workflow.service";
import { SupplierBookingService } from "../services/supplier-booking.service";
import { TravelersService } from "../services/travelers.service";
import { PaymentVaultService } from "../services/payment-vault.service";
import { DocumentStorageService } from "../services/document-storage.service";

@Controller("booking-operations")
export class BookingOperationsController {
  constructor(
    private readonly orchestration: BookingOrchestrationService,
    private readonly lifecycle: BookingLifecycleService,
    private readonly finance: FinanceDashboardService,
    private readonly suppliers: SupplierBookingService,
    private readonly invoices: InvoiceVoucherService,
    private readonly refunds: RefundWorkflowService,
    private readonly travelers: TravelersService,
    private readonly vault: PaymentVaultService,
    private readonly storage: DocumentStorageService,
  ) {}

  @Get("queue")
  @Roles(...BOOKING_AGENT_ROLES)
  listQueue(
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("pageSize", new ParseIntPipe({ optional: true })) pageSize = 25,
  ) {
    return this.orchestration.listOperationsQueue(page, pageSize);
  }

  @Post("initiate")
  @Roles(...BOOKING_AGENT_ROLES)
  initiate(@CurrentUser() user: AuthenticatedUser, @Body() dto: InitiateBookingDto) {
    return this.orchestration.initiateFromLead(user, {
      leadId: dto.lead_id,
      grossRevenue: dto.gross_revenue,
      currency: dto.currency,
      partnerName: dto.partner_name,
      confirmationReference: dto.confirmation_reference,
      notes: dto.notes,
      supplierId: dto.supplier_id,
      vehicleId: dto.vehicle_id,
      idempotencyKey: dto.idempotency_key,
    });
  }

  @Get("bookings/:id/timeline")
  @Roles(...BOOKING_AGENT_ROLES)
  timeline(@Param("id", ParseUUIDPipe) id: string) {
    return this.lifecycle.getTimeline(id);
  }

  @Get("finance/overview")
  @Roles(...BOOKING_FINANCE_ROLES)
  financeOverview() {
    return this.finance.getOverview();
  }

  @Get("suppliers")
  @Roles(...BOOKING_OPERATIONS_ROLES)
  listSuppliers() {
    return this.suppliers.listSuppliers();
  }

  @Get("suppliers/queue")
  @Roles(...BOOKING_OPERATIONS_ROLES)
  supplierQueue() {
    return this.suppliers.listQueue();
  }

  @Post("bookings/:bookingId/supplier-bookings")
  @Roles(...BOOKING_OPERATIONS_ROLES)
  createSupplierBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param("bookingId", ParseUUIDPipe) bookingId: string,
    @Body() body: { supplier_id: string; reference?: string },
  ) {
    return this.suppliers.createManualSupplierBooking(
      bookingId,
      body.supplier_id,
      user.id,
      body.reference,
    );
  }

  @Post("supplier-bookings/:id/confirm")
  @Roles(...BOOKING_OPERATIONS_ROLES)
  confirmSupplier(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ConfirmSupplierBookingDto,
  ) {
    return this.suppliers.confirmSupplierBooking(id, dto.confirmation_number, user.id);
  }

  @Post("bookings/:id/invoices")
  @Roles(...BOOKING_OPERATIONS_ROLES)
  generateInvoice(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.invoices.generateInvoice(id, user.id);
  }

  @Post("bookings/:id/vouchers")
  @Roles(...BOOKING_OPERATIONS_ROLES)
  generateVoucher(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.invoices.generateVoucher(id, user.id);
  }

  @Get("bookings/:id/documents")
  @Roles(...BOOKING_AGENT_ROLES)
  listDocuments(@Param("id", ParseUUIDPipe) id: string) {
    return this.invoices.listDocuments(id);
  }

  @Get("refunds/queue")
  @Roles(...BOOKING_FINANCE_ROLES)
  refundQueue() {
    return this.refunds.listFinanceQueue();
  }

  @Post("refunds")
  @Roles(...BOOKING_FINANCE_ROLES)
  createRefund(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRefundRequestDto) {
    return this.refunds.createRefundRequest(user, {
      bookingId: dto.booking_id,
      transactionId: dto.transaction_id,
      amount: dto.amount,
      currency: dto.currency ?? "USD",
      reason: dto.reason,
      idempotencyKey: dto.idempotency_key,
    });
  }

  @Post("refunds/:id/approve")
  @Roles(UserRole.admin, UserRole.finance_admin)
  approveRefund(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.refunds.approveRefund(user, id);
  }

  @Post("refunds/:id/process")
  @Roles(UserRole.admin, UserRole.finance_admin)
  processRefund(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.refunds.processRefund(user, id);
  }

  @Get("travelers")
  @Roles(...BOOKING_AGENT_ROLES)
  listTravelers(
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("pageSize", new ParseIntPipe({ optional: true })) pageSize = 25,
    @Query("recurringOnly") recurringOnly?: string,
    @Query("vipOnly") vipOnly?: string,
  ) {
    return this.travelers.list(page, pageSize, {
      recurringOnly: recurringOnly === "true",
      vipOnly: vipOnly === "true",
    });
  }

  @Get("travelers/:id")
  @Roles(...BOOKING_AGENT_ROLES)
  getTraveler(@Param("id", ParseUUIDPipe) id: string) {
    return this.travelers.getById(id);
  }

  @Post("vault/entries")
  @Roles(UserRole.admin, UserRole.finance_admin)
  storeVault(@CurrentUser() user: AuthenticatedUser, @Body() dto: StoreVaultEntryDto) {
    return this.vault.storeVaultEntry({
      travelerId: dto.traveler_id,
      tokenReference: dto.token_reference,
      last4: dto.last4,
      cardBrand: dto.card_brand,
      expMonth: dto.exp_month,
      expYear: dto.exp_year,
      billingName: dto.billing_name,
      encryptedTokenPayload: dto.encrypted_token_payload ?? { token: dto.token_reference },
      actorId: user.id,
    });
  }

  @Get("travelers/:id/vault")
  @Roles(UserRole.admin, UserRole.finance_admin)
  listVault(@Param("id", ParseUUIDPipe) travelerId: string) {
    return this.vault.listMaskedCards(travelerId);
  }

  @Get("documents/:fileName")
  @Roles(...BOOKING_AGENT_ROLES)
  async downloadDocument(@Param("fileName") fileName: string, @Res() res: Response) {
    const path = this.storage.resolveLocalPath(decodeURIComponent(fileName));
    return res.download(path);
  }
}
