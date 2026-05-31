-- CreateEnum
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('INITIATED', 'ORDER_CREATED', 'SUBMITTED', 'CAPTURED', 'FAILED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "AuditLogAction" ADD VALUE 'PAYMENT_ATTEMPT_CREATED';
ALTER TYPE "AuditLogAction" ADD VALUE 'PAYMENT_ATTEMPT_FAILED';
ALTER TYPE "AuditLogAction" ADD VALUE 'PAYPAL_ORDER_CREATED';
ALTER TYPE "AuditLogAction" ADD VALUE 'PAYPAL_ORDER_CAPTURED';
ALTER TYPE "AuditLogAction" ADD VALUE 'GATEWAY_HEALTH_CHECK';

-- AlterTable
ALTER TABLE "payment_sessions" ADD COLUMN "checkout_mode" VARCHAR(64) NOT NULL DEFAULT 'gateway_checkout';
ALTER TABLE "payment_sessions" ADD COLUMN "provider_order_id" TEXT;

-- CreateIndex
CREATE INDEX "payment_sessions_provider_order_id_idx" ON "payment_sessions"("provider_order_id");

-- AlterTable
ALTER TABLE "payment_transactions" ADD COLUMN "payment_session_id" UUID;

-- CreateIndex
CREATE INDEX "payment_transactions_payment_session_id_idx" ON "payment_transactions"("payment_session_id");

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_payment_session_id_fkey" FOREIGN KEY ("payment_session_id") REFERENCES "payment_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "payment_session_attempts" (
    "id" UUID NOT NULL,
    "payment_session_id" UUID NOT NULL,
    "gateway_id" UUID NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'INITIATED',
    "provider_order_id" TEXT,
    "provider_capture_id" TEXT,
    "failure_reason" TEXT,
    "provider_response" JSONB,
    "initiated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_session_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_session_attempts_payment_session_id_created_at_idx" ON "payment_session_attempts"("payment_session_id", "created_at");
CREATE INDEX "payment_session_attempts_gateway_id_status_idx" ON "payment_session_attempts"("gateway_id", "status");
CREATE INDEX "payment_session_attempts_provider_order_id_idx" ON "payment_session_attempts"("provider_order_id");

-- AddForeignKey
ALTER TABLE "payment_session_attempts" ADD CONSTRAINT "payment_session_attempts_payment_session_id_fkey" FOREIGN KEY ("payment_session_id") REFERENCES "payment_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_session_attempts" ADD CONSTRAINT "payment_session_attempts_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "payment_gateways"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_session_attempts" ADD CONSTRAINT "payment_session_attempts_initiated_by_id_fkey" FOREIGN KEY ("initiated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
