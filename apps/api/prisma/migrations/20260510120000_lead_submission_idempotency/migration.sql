-- Idempotent public lead submissions and indexed assignment reads.
CREATE TABLE "lead_submissions" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "response" JSONB,
    "lead_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_submissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lead_submissions_key_key" ON "lead_submissions"("key");
CREATE INDEX "lead_submissions_lead_id_idx" ON "lead_submissions"("lead_id");
CREATE INDEX "lead_submissions_created_at_idx" ON "lead_submissions"("created_at");
CREATE INDEX "users_role_is_active_current_lead_count_created_at_idx" ON "users"("role", "is_active", "current_lead_count", "created_at");
CREATE INDEX "leads_customer_email_customer_phone_created_at_idx" ON "leads"("customer_email", "customer_phone", "created_at");

ALTER TABLE "lead_submissions"
ADD CONSTRAINT "lead_submissions_lead_id_fkey"
FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
