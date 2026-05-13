-- AlterTable
ALTER TABLE "leads" ADD COLUMN "follow_up_at" TIMESTAMP(3);

CREATE INDEX "leads_follow_up_at_idx" ON "leads"("follow_up_at");
