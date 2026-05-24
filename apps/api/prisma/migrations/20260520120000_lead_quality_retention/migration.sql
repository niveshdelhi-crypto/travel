-- Lead nurturing: high-quality flag and retention window for re-approach
ALTER TABLE "leads" ADD COLUMN "is_high_quality" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "leads" ADD COLUMN "retain_until" TIMESTAMP(3);

CREATE INDEX "leads_is_high_quality_retain_until_idx" ON "leads"("is_high_quality", "retain_until");

-- Normalize demo phones with spaces so outbound dial validates (E.164)
UPDATE "leads"
SET "customer_phone" = '+14155550100'
WHERE "customer_phone" LIKE '%4155550100%';
