-- Must run after TELNYX enum value is committed (separate migration from enum ADD VALUE).
ALTER TABLE "calls" ALTER COLUMN "provider" SET DEFAULT 'TELNYX';
