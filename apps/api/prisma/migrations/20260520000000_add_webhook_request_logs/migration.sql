-- CreateEnum
CREATE TYPE "WebhookProvider" AS ENUM ('VONAGE');

-- CreateTable
CREATE TABLE "webhook_request_logs" (
    "id" UUID NOT NULL,
    "provider" "WebhookProvider" NOT NULL,
    "endpoint" TEXT NOT NULL,
    "headers" JSONB NOT NULL,
    "payload" JSONB,
    "signature_valid" BOOLEAN,
    "ip_address" TEXT,
    "response_code" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webhook_request_logs_provider_created_at_idx" ON "webhook_request_logs"("provider", "created_at");

-- CreateIndex
CREATE INDEX "webhook_request_logs_endpoint_created_at_idx" ON "webhook_request_logs"("endpoint", "created_at");

-- CreateIndex
CREATE INDEX "webhook_request_logs_signature_valid_created_at_idx" ON "webhook_request_logs"("signature_valid", "created_at");
