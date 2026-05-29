-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'operations_manager';

-- CreateEnum
CREATE TYPE "BookingLifecycleStatus" AS ENUM (
  'BOOKING_REQUESTED', 'PAYMENT_PENDING', 'PAYMENT_PROCESSING', 'PAYMENT_SUCCESS',
  'SUPPLIER_BOOKING_PENDING', 'BOOKING_CONFIRMED', 'VOUCHER_GENERATED', 'CUSTOMER_NOTIFIED',
  'COMPLETED', 'PAYMENT_FAILED', 'BOOKING_FAILED', 'REFUND_PENDING', 'REFUNDED', 'CHARGEBACK', 'CANCELLED'
);
CREATE TYPE "SupplierIntegrationType" AS ENUM ('MANUAL', 'API');
CREATE TYPE "SupplierBookingStatus" AS ENUM ('PENDING', 'SUBMITTED', 'CONFIRMED', 'FAILED', 'CANCELLED');
CREATE TYPE "RefundRequestStatus" AS ENUM ('REFUND_REQUESTED', 'REFUND_APPROVED', 'REFUND_PROCESSING', 'REFUNDED', 'REFUND_REJECTED');
CREATE TYPE "ChargebackStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'WON', 'LOST', 'CLOSED');
CREATE TYPE "StoredDocumentKind" AS ENUM ('INVOICE', 'VOUCHER', 'RECEIPT');
CREATE TYPE "BookingJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE "BookingJobType" AS ENUM ('GENERATE_INVOICE', 'GENERATE_VOUCHER', 'NOTIFY_CUSTOMER', 'SUPPLIER_SYNC', 'PAYMENT_RETRY');

-- AlterEnum AuditLogAction (append values)
ALTER TYPE "AuditLogAction" ADD VALUE IF NOT EXISTS 'BOOKING_CREATED';
ALTER TYPE "AuditLogAction" ADD VALUE IF NOT EXISTS 'BOOKING_LIFECYCLE_TRANSITION';
ALTER TYPE "AuditLogAction" ADD VALUE IF NOT EXISTS 'BOOKING_FAILED';
ALTER TYPE "AuditLogAction" ADD VALUE IF NOT EXISTS 'TRAVELER_CREATED';
ALTER TYPE "AuditLogAction" ADD VALUE IF NOT EXISTS 'TRAVELER_UPDATED';
ALTER TYPE "AuditLogAction" ADD VALUE IF NOT EXISTS 'SUPPLIER_BOOKING_CREATED';
ALTER TYPE "AuditLogAction" ADD VALUE IF NOT EXISTS 'SUPPLIER_BOOKING_SYNCED';
ALTER TYPE "AuditLogAction" ADD VALUE IF NOT EXISTS 'INVOICE_GENERATED';
ALTER TYPE "AuditLogAction" ADD VALUE IF NOT EXISTS 'VOUCHER_GENERATED';
ALTER TYPE "AuditLogAction" ADD VALUE IF NOT EXISTS 'REFUND_REQUESTED';
ALTER TYPE "AuditLogAction" ADD VALUE IF NOT EXISTS 'REFUND_APPROVED';
ALTER TYPE "AuditLogAction" ADD VALUE IF NOT EXISTS 'REFUND_COMPLETED';
ALTER TYPE "AuditLogAction" ADD VALUE IF NOT EXISTS 'CHARGEBACK_OPENED';
ALTER TYPE "AuditLogAction" ADD VALUE IF NOT EXISTS 'VAULT_ENTRY_CREATED';
ALTER TYPE "AuditLogAction" ADD VALUE IF NOT EXISTS 'VAULT_SESSION_CREATED';

-- AlterTable bookings
ALTER TABLE "bookings" ADD COLUMN "traveler_id" UUID;
ALTER TABLE "bookings" ADD COLUMN "supplier_id" UUID;
ALTER TABLE "bookings" ADD COLUMN "vehicle_id" UUID;
ALTER TABLE "bookings" ADD COLUMN "lifecycle_status" "BookingLifecycleStatus" NOT NULL DEFAULT 'BOOKING_REQUESTED';
ALTER TABLE "bookings" ADD COLUMN "idempotency_key" TEXT;
ALTER TABLE "bookings" ADD COLUMN "risk_score" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "bookings" ADD COLUMN "risk_metadata" JSONB;
ALTER TABLE "bookings" ADD COLUMN "clv_estimate" DECIMAL(12,2);
ALTER TABLE "bookings" ADD COLUMN "ai_insights" JSONB;

-- AlterTable leads
ALTER TABLE "leads" ADD COLUMN "traveler_id" UUID;

-- CreateTable travelers + related
CREATE TABLE "travelers" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "is_vip" BOOLEAN NOT NULL DEFAULT false,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "booking_count" INTEGER NOT NULL DEFAULT 0,
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "fraud_flags" JSONB,
    "lifetime_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ai_insights" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "travelers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "traveler_documents" (
    "id" UUID NOT NULL,
    "traveler_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT,
    "storage_key" TEXT,
    "file_url" TEXT,
    "expires_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "traveler_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "traveler_notes" (
    "id" UUID NOT NULL,
    "traveler_id" UUID NOT NULL,
    "author_id" UUID,
    "body" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "traveler_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "traveler_preferences" (
    "id" UUID NOT NULL,
    "traveler_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "traveler_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "secure_customer_payment_vault" (
    "id" UUID NOT NULL,
    "traveler_id" UUID NOT NULL,
    "token_reference" TEXT NOT NULL,
    "masked_pan" TEXT NOT NULL,
    "card_brand" TEXT,
    "exp_month" INTEGER,
    "exp_year" INTEGER,
    "encrypted_payload" TEXT NOT NULL,
    "billing_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "secure_customer_payment_vault_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "secure_payment_sessions" (
    "id" UUID NOT NULL,
    "traveler_id" UUID NOT NULL,
    "vault_id" UUID,
    "session_token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "secure_payment_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rental_suppliers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "integration_type" "SupplierIntegrationType" NOT NULL DEFAULT 'MANUAL',
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "encrypted_api_config" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "payout_terms" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rental_suppliers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "vehicle_class" TEXT NOT NULL,
    "plate_number" TEXT,
    "metadata" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "supplier_bookings" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "status" "SupplierBookingStatus" NOT NULL DEFAULT 'PENDING',
    "supplier_reference" TEXT,
    "confirmation_number" TEXT,
    "failure_reason" TEXT,
    "metadata" JSONB,
    "synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supplier_bookings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "booking_invoices" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "pdf_url" TEXT,
    "storage_key" TEXT,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    CONSTRAINT "booking_invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "booking_vouchers" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "voucher_number" TEXT NOT NULL,
    "pdf_url" TEXT,
    "storage_key" TEXT,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "metadata" JSONB,
    CONSTRAINT "booking_vouchers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refund_requests" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "transaction_id" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "status" "RefundRequestStatus" NOT NULL DEFAULT 'REFUND_REQUESTED',
    "is_partial" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "requested_by" UUID,
    "approved_by" UUID,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "refund_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chargeback_cases" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "transaction_id" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "status" "ChargebackStatus" NOT NULL DEFAULT 'OPEN',
    "provider_reference" TEXT,
    "reason" TEXT,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "metadata" JSONB,
    CONSTRAINT "chargeback_cases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "booking_lifecycle_events" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "from_status" "BookingLifecycleStatus",
    "to_status" "BookingLifecycleStatus" NOT NULL,
    "actor_id" UUID,
    "ip_address" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booking_lifecycle_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "booking_background_jobs" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "job_type" "BookingJobType" NOT NULL,
    "status" "BookingJobStatus" NOT NULL DEFAULT 'PENDING',
    "idempotency_key" TEXT NOT NULL,
    "payload" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "last_error" TEXT,
    "scheduled_for" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "booking_background_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stored_documents" (
    "id" UUID NOT NULL,
    "kind" "StoredDocumentKind" NOT NULL,
    "reference_id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "public_url" TEXT,
    "mime_type" TEXT NOT NULL DEFAULT 'application/pdf',
    "byte_size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stored_documents_pkey" PRIMARY KEY ("id")
);

-- Indexes & uniques
CREATE UNIQUE INDEX "travelers_email_key" ON "travelers"("email");
CREATE INDEX "travelers_is_recurring_booking_count_idx" ON "travelers"("is_recurring", "booking_count");
CREATE INDEX "travelers_risk_score_idx" ON "travelers"("risk_score");
CREATE INDEX "traveler_documents_traveler_id_created_at_idx" ON "traveler_documents"("traveler_id", "created_at");
CREATE INDEX "traveler_notes_traveler_id_created_at_idx" ON "traveler_notes"("traveler_id", "created_at");
CREATE UNIQUE INDEX "traveler_preferences_traveler_id_key_key" ON "traveler_preferences"("traveler_id", "key");
CREATE INDEX "secure_customer_payment_vault_traveler_id_is_active_idx" ON "secure_customer_payment_vault"("traveler_id", "is_active");
CREATE INDEX "secure_payment_sessions_traveler_id_expires_at_idx" ON "secure_payment_sessions"("traveler_id", "expires_at");
CREATE UNIQUE INDEX "rental_suppliers_slug_key" ON "rental_suppliers"("slug");
CREATE INDEX "vehicles_supplier_id_is_active_idx" ON "vehicles"("supplier_id", "is_active");
CREATE INDEX "supplier_bookings_booking_id_status_idx" ON "supplier_bookings"("booking_id", "status");
CREATE UNIQUE INDEX "booking_invoices_invoice_number_key" ON "booking_invoices"("invoice_number");
CREATE UNIQUE INDEX "booking_vouchers_voucher_number_key" ON "booking_vouchers"("voucher_number");
CREATE UNIQUE INDEX "refund_requests_idempotency_key_key" ON "refund_requests"("idempotency_key");
CREATE INDEX "bookings_lifecycle_status_created_at_idx" ON "bookings"("lifecycle_status", "created_at");
CREATE UNIQUE INDEX "bookings_idempotency_key_key" ON "bookings"("idempotency_key");
CREATE INDEX "leads_traveler_id_idx" ON "leads"("traveler_id");
CREATE INDEX "booking_background_jobs_status_scheduled_for_idx" ON "booking_background_jobs"("status", "scheduled_for");

-- Foreign keys
ALTER TABLE "leads" ADD CONSTRAINT "leads_traveler_id_fkey" FOREIGN KEY ("traveler_id") REFERENCES "travelers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_traveler_id_fkey" FOREIGN KEY ("traveler_id") REFERENCES "travelers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "rental_suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "traveler_documents" ADD CONSTRAINT "traveler_documents_traveler_id_fkey" FOREIGN KEY ("traveler_id") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "traveler_notes" ADD CONSTRAINT "traveler_notes_traveler_id_fkey" FOREIGN KEY ("traveler_id") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "traveler_notes" ADD CONSTRAINT "traveler_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "traveler_preferences" ADD CONSTRAINT "traveler_preferences_traveler_id_fkey" FOREIGN KEY ("traveler_id") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "secure_customer_payment_vault" ADD CONSTRAINT "secure_customer_payment_vault_traveler_id_fkey" FOREIGN KEY ("traveler_id") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "secure_payment_sessions" ADD CONSTRAINT "secure_payment_sessions_traveler_id_fkey" FOREIGN KEY ("traveler_id") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "secure_payment_sessions" ADD CONSTRAINT "secure_payment_sessions_vault_id_fkey" FOREIGN KEY ("vault_id") REFERENCES "secure_customer_payment_vault"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "rental_suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "supplier_bookings" ADD CONSTRAINT "supplier_bookings_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "supplier_bookings" ADD CONSTRAINT "supplier_bookings_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "rental_suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "booking_invoices" ADD CONSTRAINT "booking_invoices_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_vouchers" ADD CONSTRAINT "booking_vouchers_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chargeback_cases" ADD CONSTRAINT "chargeback_cases_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_lifecycle_events" ADD CONSTRAINT "booking_lifecycle_events_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_lifecycle_events" ADD CONSTRAINT "booking_lifecycle_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "booking_background_jobs" ADD CONSTRAINT "booking_background_jobs_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill lifecycle for existing completed bookings
UPDATE "bookings" SET "lifecycle_status" = 'COMPLETED' WHERE "status" = 'COMPLETED';
