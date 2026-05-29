-- AlterEnum: add finance_admin to UserRole
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'finance_admin';

-- CreateEnum
CREATE TYPE "PaymentGatewayType" AS ENUM ('stripe', 'paypal', 'wise');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED');
CREATE TYPE "BookingStatus" AS ENUM ('DRAFT', 'PAYMENT_PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "TransactionType" AS ENUM ('CHARGE', 'REFUND', 'AUTHORIZATION', 'CAPTURE', 'PAYOUT');
CREATE TYPE "AuditLogAction" AS ENUM (
  'PAYMENT_GATEWAY_CREATED',
  'PAYMENT_GATEWAY_UPDATED',
  'PAYMENT_GATEWAY_DEACTIVATED',
  'PAYMENT_REQUEST_CREATED',
  'PAYMENT_PROCESSING',
  'PAYMENT_SUCCESS',
  'PAYMENT_FAILED',
  'PAYMENT_REFUNDED',
  'BOOKING_CONFIRMED',
  'PAYMENT_ROUTE_ACCESSED'
);

-- AlterTable: bookings
ALTER TABLE "bookings" ADD COLUMN "status" "BookingStatus" NOT NULL DEFAULT 'COMPLETED';
ALTER TABLE "bookings" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable: payment_gateways
CREATE TABLE "payment_gateways" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PaymentGatewayType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "encrypted_credentials" TEXT NOT NULL,
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_gateways_pkey" PRIMARY KEY ("id")
);

-- CreateTable: booking_payment_requests
CREATE TABLE "booking_payment_requests" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "gateway_id" UUID NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "provider_checkout_url" TEXT,
    "provider_reference" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "metadata" JSONB,
    "requested_by" UUID,
    "expires_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_payment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable: payment_transactions
CREATE TABLE "payment_transactions" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "gateway_id" UUID NOT NULL,
    "payment_request_id" UUID,
    "type" "TransactionType" NOT NULL DEFAULT 'CHARGE',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "provider_reference" TEXT,
    "provider_response" JSONB,
    "failure_reason" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "created_by" UUID,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: audit_logs
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "action" "AuditLogAction" NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" UUID,
    "user_id" UUID,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "request_method" TEXT,
    "request_path" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_gateways_type_name_key" ON "payment_gateways"("type", "name");
CREATE INDEX "payment_gateways_type_is_active_idx" ON "payment_gateways"("type", "is_active");
CREATE UNIQUE INDEX "booking_payment_requests_idempotency_key_key" ON "booking_payment_requests"("idempotency_key");
CREATE INDEX "booking_payment_requests_booking_id_status_idx" ON "booking_payment_requests"("booking_id", "status");
CREATE INDEX "booking_payment_requests_gateway_id_status_idx" ON "booking_payment_requests"("gateway_id", "status");
CREATE INDEX "booking_payment_requests_status_created_at_idx" ON "booking_payment_requests"("status", "created_at");
CREATE UNIQUE INDEX "payment_transactions_idempotency_key_key" ON "payment_transactions"("idempotency_key");
CREATE INDEX "payment_transactions_booking_id_status_idx" ON "payment_transactions"("booking_id", "status");
CREATE INDEX "payment_transactions_gateway_id_status_idx" ON "payment_transactions"("gateway_id", "status");
CREATE INDEX "payment_transactions_payment_request_id_idx" ON "payment_transactions"("payment_request_id");
CREATE INDEX "payment_transactions_status_created_at_idx" ON "payment_transactions"("status", "created_at");
CREATE INDEX "payment_transactions_provider_reference_idx" ON "payment_transactions"("provider_reference");
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");
CREATE INDEX "audit_logs_resource_type_resource_id_idx" ON "audit_logs"("resource_type", "resource_id");
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");
CREATE INDEX "bookings_status_created_at_idx" ON "bookings"("status", "created_at");

-- AddForeignKey
ALTER TABLE "booking_payment_requests" ADD CONSTRAINT "booking_payment_requests_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_payment_requests" ADD CONSTRAINT "booking_payment_requests_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "payment_gateways"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "booking_payment_requests" ADD CONSTRAINT "booking_payment_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "payment_gateways"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_payment_request_id_fkey" FOREIGN KEY ("payment_request_id") REFERENCES "booking_payment_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
