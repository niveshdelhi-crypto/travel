-- CreateEnum
CREATE TYPE "CallDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('INITIATED', 'RINGING', 'ANSWERED', 'COMPLETED', 'FAILED', 'BUSY', 'NO_ANSWER', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CallProvider" AS ENUM ('VONAGE');

-- CreateEnum
CREATE TYPE "CallEventType" AS ENUM ('CREATED', 'RINGING', 'ANSWERED', 'COMPLETED', 'FAILED', 'BUSY', 'NO_ANSWER', 'RECORDING_STARTED', 'RECORDING_STOPPED', 'WEBHOOK_RECEIVED', 'STATE_CHANGED');

-- DropIndex
DROP INDEX "leads_follow_up_at_idx";

-- AlterTable
ALTER TABLE "marketplace_countries" ALTER COLUMN "iso_code" SET DATA TYPE VARCHAR(2);

-- AlterTable
ALTER TABLE "marketplace_destinations" ALTER COLUMN "iata_code" SET DATA TYPE VARCHAR(3);

-- CreateTable
CREATE TABLE "calls" (
    "id" UUID NOT NULL,
    "provider" "CallProvider" NOT NULL DEFAULT 'VONAGE',
    "provider_call_id" TEXT,
    "direction" "CallDirection" NOT NULL,
    "status" "CallStatus" NOT NULL DEFAULT 'INITIATED',
    "from_number" TEXT NOT NULL,
    "to_number" TEXT NOT NULL,
    "agent_id" UUID,
    "lead_id" UUID,
    "started_at" TIMESTAMP(3),
    "answered_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "duration_seconds" INTEGER,
    "failure_reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_events" (
    "id" UUID NOT NULL,
    "call_id" UUID NOT NULL,
    "event_type" "CallEventType" NOT NULL,
    "provider_event" TEXT,
    "payload" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_recordings" (
    "id" UUID NOT NULL,
    "call_id" UUID NOT NULL,
    "provider_recording_id" TEXT,
    "url" TEXT,
    "duration_seconds" INTEGER,
    "format" TEXT,
    "status" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "active_call_sessions" (
    "id" UUID NOT NULL,
    "call_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "provider_call_id" TEXT,
    "status" "CallStatus" NOT NULL,
    "connected_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "active_call_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calls_provider_call_id_key" ON "calls"("provider_call_id");

-- CreateIndex
CREATE INDEX "calls_agent_id_status_idx" ON "calls"("agent_id", "status");

-- CreateIndex
CREATE INDEX "calls_lead_id_created_at_idx" ON "calls"("lead_id", "created_at");

-- CreateIndex
CREATE INDEX "calls_provider_call_id_idx" ON "calls"("provider_call_id");

-- CreateIndex
CREATE INDEX "calls_status_created_at_idx" ON "calls"("status", "created_at");

-- CreateIndex
CREATE INDEX "calls_direction_created_at_idx" ON "calls"("direction", "created_at");

-- CreateIndex
CREATE INDEX "call_events_call_id_occurred_at_idx" ON "call_events"("call_id", "occurred_at");

-- CreateIndex
CREATE INDEX "call_events_event_type_occurred_at_idx" ON "call_events"("event_type", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "call_recordings_provider_recording_id_key" ON "call_recordings"("provider_recording_id");

-- CreateIndex
CREATE INDEX "call_recordings_call_id_created_at_idx" ON "call_recordings"("call_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "active_call_sessions_call_id_key" ON "active_call_sessions"("call_id");

-- CreateIndex
CREATE INDEX "active_call_sessions_agent_id_status_idx" ON "active_call_sessions"("agent_id", "status");

-- CreateIndex
CREATE INDEX "active_call_sessions_provider_call_id_idx" ON "active_call_sessions"("provider_call_id");

-- CreateIndex
CREATE INDEX "active_call_sessions_expires_at_idx" ON "active_call_sessions"("expires_at");

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_events" ADD CONSTRAINT "call_events_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_recordings" ADD CONSTRAINT "call_recordings_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_call_sessions" ADD CONSTRAINT "active_call_sessions_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_call_sessions" ADD CONSTRAINT "active_call_sessions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
