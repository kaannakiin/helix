-- ─── Drift Fix Migration ──────────────────────────────────────────────────────
-- Fixes objects that exist in schema but were never applied to DB:
-- 1. BuyerType enum (added to schema but no migration was generated)
-- 2. PriceListPrice composite currency index (added via Prisma schema)
-- 3. Drops PriceList_derived_active_idx (partial index not managed by Prisma;
--    Prisma would generate a DROP for it on every migrate dev run otherwise)

-- 1. BuyerType enum
DO $$ BEGIN
  CREATE TYPE "BuyerType" AS ENUM ('CUSTOMER', 'ORGANIZATION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. PriceListPrice composite index (Prisma-managed, was missing from DB)
CREATE INDEX IF NOT EXISTS "PriceListPrice_priceListId_productVariantId_currencyCode_idx"
  ON "PriceListPrice"("priceListId", "productVariantId", "currencyCode");

-- 3. Drop partial index that Prisma cannot model (prevents migrate dev drift)
DROP INDEX IF EXISTS "PriceList_derived_active_idx";
