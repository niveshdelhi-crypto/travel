-- CreateEnum
CREATE TYPE "PaymentSessionStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED');

-- AlterEnum
ALTER TYPE "AuditLogAction" ADD VALUE 'PAYMENT_SESSION_CREATED';
ALTER TYPE "AuditLogAction" ADD VALUE 'PAYMENT_SESSION_ASSIGNED';
ALTER TYPE "AuditLogAction" ADD VALUE 'PAYMENT_SESSION_OPENED';
ALTER TYPE "AuditLogAction" ADD VALUE 'PAYMENT_SESSION_PROCESSING';
ALTER TYPE "AuditLogAction" ADD VALUE 'PAYMENT_SESSION_SUCCESS';
ALTER TYPE "AuditLogAction" ADD VALUE 'PAYMENT_SESSION_FAILURE';
ALTER TYPE "AuditLogAction" ADD VALUE 'PAYMENT_SESSION_CANCELLED';

-- AlterTable
ALTER TABLE "leads" ADD COLUMN "is_recurring_customer" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "leads" ADD COLUMN "customer_lifetime_value" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "payment_sessions" (
    "id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "gateway_id" UUID NOT NULL,
    "requested_by_id" UUID NOT NULL,
    "processed_by_id" UUID,
    "status" "PaymentSessionStatus" NOT NULL DEFAULT 'PENDING',
    "finance_notes" TEXT,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_sessions_status_idx" ON "payment_sessions"("status");
CREATE INDEX "payment_sessions_booking_id_idx" ON "payment_sessions"("booking_id");
CREATE INDEX "payment_sessions_requested_by_id_idx" ON "payment_sessions"("requested_by_id");
CREATE INDEX "payment_sessions_created_at_idx" ON "payment_sessions"("created_at");

-- AddForeignKey
ALTER TABLE "payment_sessions" ADD CONSTRAINT "payment_sessions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_sessions" ADD CONSTRAINT "payment_sessions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_sessions" ADD CONSTRAINT "payment_sessions_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "payment_gateways"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_sessions" ADD CONSTRAINT "payment_sessions_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_sessions" ADD CONSTRAINT "payment_sessions_processed_by_id_fkey" FOREIGN KEY ("processed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
