-- Inbound-call-first: Telnyx provider, dispositions, agent direct lines, traveler call links

CREATE TYPE "CallDispositionType" AS ENUM (
  'ANSWERED',
  'BUSY',
  'NO_ANSWER',
  'VOICEMAIL',
  'CALLBACK_REQUESTED'
);

ALTER TYPE "CallProvider" ADD VALUE IF NOT EXISTS 'TELNYX';
ALTER TYPE "WebhookProvider" ADD VALUE IF NOT EXISTS 'TELNYX';
ALTER TYPE "CallStatus" ADD VALUE IF NOT EXISTS 'VOICEMAIL';

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "direct_line" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "users_direct_line_key" ON "users"("direct_line");

ALTER TABLE "calls" ADD COLUMN IF NOT EXISTS "traveler_id" UUID;
ALTER TABLE "calls" ADD COLUMN IF NOT EXISTS "recording_url" TEXT;
-- Default switched to TELNYX in 20260531170000_call_provider_telnyx_default (enum must commit first)

ALTER TABLE "call_recordings" ADD COLUMN IF NOT EXISTS "traveler_id" UUID;

CREATE TABLE IF NOT EXISTS "call_dispositions" (
  "id" UUID NOT NULL,
  "call_id" UUID NOT NULL,
  "disposition" "CallDispositionType" NOT NULL,
  "notes" TEXT,
  "set_by" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "call_dispositions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "call_dispositions_call_id_key" ON "call_dispositions"("call_id");
CREATE INDEX IF NOT EXISTS "call_dispositions_disposition_created_at_idx" ON "call_dispositions"("disposition", "created_at");

ALTER TABLE "calls"
  ADD CONSTRAINT "calls_traveler_id_fkey"
  FOREIGN KEY ("traveler_id") REFERENCES "travelers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "call_recordings"
  ADD CONSTRAINT "call_recordings_traveler_id_fkey"
  FOREIGN KEY ("traveler_id") REFERENCES "travelers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "call_dispositions"
  ADD CONSTRAINT "call_dispositions_call_id_fkey"
  FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "call_dispositions"
  ADD CONSTRAINT "call_dispositions_set_by_fkey"
  FOREIGN KEY ("set_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "calls_traveler_id_created_at_idx" ON "calls"("traveler_id", "created_at");
CREATE INDEX IF NOT EXISTS "calls_from_number_created_at_idx" ON "calls"("from_number", "created_at");
CREATE INDEX IF NOT EXISTS "calls_started_at_idx" ON "calls"("started_at");
CREATE INDEX IF NOT EXISTS "call_recordings_traveler_id_created_at_idx" ON "call_recordings"("traveler_id", "created_at");
CREATE INDEX IF NOT EXISTS "travelers_phone_idx" ON "travelers"("phone");
