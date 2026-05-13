-- CreateEnum
CREATE TYPE "MarketplaceDestinationKind" AS ENUM ('CITY', 'AIRPORT');

-- CreateTable
CREATE TABLE "marketplace_suppliers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "website_url" TEXT,
    "logo_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_countries" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iso_code" CHAR(2) NOT NULL,
    "headline" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_destinations" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "MarketplaceDestinationKind" NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT,
    "iata_code" CHAR(3),
    "country_id" UUID NOT NULL,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "trend_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_testimonials" (
    "id" UUID NOT NULL,
    "quote" TEXT NOT NULL,
    "author_display" TEXT NOT NULL,
    "meta_line" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "is_editorial" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_suppliers_slug_key" ON "marketplace_suppliers"("slug");

-- CreateIndex
CREATE INDEX "marketplace_suppliers_sort_order_idx" ON "marketplace_suppliers"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_countries_slug_key" ON "marketplace_countries"("slug");

-- CreateIndex
CREATE INDEX "marketplace_countries_name_idx" ON "marketplace_countries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_destinations_slug_kind_key" ON "marketplace_destinations"("slug", "kind");

-- CreateIndex
CREATE INDEX "marketplace_destinations_country_id_kind_idx" ON "marketplace_destinations"("country_id", "kind");

-- CreateIndex
CREATE INDEX "marketplace_destinations_kind_trend_score_idx" ON "marketplace_destinations"("kind", "trend_score");

-- CreateIndex
CREATE INDEX "marketplace_testimonials_is_editorial_sort_order_idx" ON "marketplace_testimonials"("is_editorial", "sort_order");

-- AddForeignKey
ALTER TABLE "marketplace_destinations" ADD CONSTRAINT "marketplace_destinations_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "marketplace_countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
