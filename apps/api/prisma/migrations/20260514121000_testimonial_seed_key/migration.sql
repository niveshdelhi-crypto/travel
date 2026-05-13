-- AlterTable
ALTER TABLE "marketplace_testimonials" ADD COLUMN "seed_key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_testimonials_seed_key_key" ON "marketplace_testimonials"("seed_key");
