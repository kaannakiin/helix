-- ═══════════════════════════════════════════════════════════════════════════════
-- Pricing v2 Migration (idempotent)
-- ═══════════════════════════════════════════════════════════════════════════════

-- CreateEnum (idempotent)
DO $$ BEGIN
  CREATE TYPE "TaxBehavior" AS ENUM ('INCLUSIVE', 'EXCLUSIVE', 'UNSPECIFIED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RoundingRule" AS ENUM ('NONE', 'ROUND_99', 'ROUND_95', 'ROUND_NEAREST', 'ROUND_UP', 'ROUND_DOWN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AssignmentTargetType" AS ENUM ('ALL_CUSTOMERS', 'CUSTOMER_GROUP', 'ORGANIZATION', 'CUSTOMER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterEnum (idempotent)
DO $$ BEGIN
  ALTER TYPE "ExternalEntityType" ADD VALUE 'PRICE_LIST_ASSIGNMENT';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "PriceListType" ADD VALUE 'CONTRACT';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PriceList: Rename currencyCode → defaultCurrencyCode + add new columns
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add defaultCurrencyCode as nullable, copy data from currencyCode if it exists, then make NOT NULL
ALTER TABLE "PriceList" ADD COLUMN IF NOT EXISTS "defaultCurrencyCode" "CurrencyCode";
DO $$ BEGIN
  UPDATE "PriceList" SET "defaultCurrencyCode" = "currencyCode" WHERE "defaultCurrencyCode" IS NULL;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;
ALTER TABLE "PriceList" ALTER COLUMN "defaultCurrencyCode" SET NOT NULL;

-- Drop old column and indexes
DROP INDEX IF EXISTS "PriceList_currencyCode_idx";
DROP INDEX IF EXISTS "PriceList_type_currencyCode_idx";
ALTER TABLE "PriceList" DROP COLUMN IF EXISTS "currencyCode";

-- Add new PriceList columns
ALTER TABLE "PriceList" ADD COLUMN IF NOT EXISTS "contractRef" TEXT;
ALTER TABLE "PriceList" ADD COLUMN IF NOT EXISTS "isExchangeRateDerived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PriceList" ADD COLUMN IF NOT EXISTS "isSourceLocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PriceList" ADD COLUMN IF NOT EXISTS "roundingRule" "RoundingRule" NOT NULL DEFAULT 'NONE';
ALTER TABLE "PriceList" ADD COLUMN IF NOT EXISTS "sourceCurrencyCode" "CurrencyCode";
ALTER TABLE "PriceList" ADD COLUMN IF NOT EXISTS "sourceSystem" "SourceSystem" NOT NULL DEFAULT 'INTERNAL';

-- Create new PriceList indexes
CREATE INDEX IF NOT EXISTS "PriceList_defaultCurrencyCode_idx" ON "PriceList"("defaultCurrencyCode");
CREATE INDEX IF NOT EXISTS "PriceList_type_defaultCurrencyCode_idx" ON "PriceList"("type", "defaultCurrencyCode");

-- ═══════════════════════════════════════════════════════════════════════════════
-- PriceListPrice: Add new columns with data migration
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ensure a default UoM exists for backfilling
INSERT INTO "UnitOfMeasure" ("id", "code", "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES ('default_uom_pc', 'PC', true, 0, NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- Drop old unique constraint
DROP INDEX IF EXISTS "PriceListPrice_priceListId_productVariantId_key";

-- Add currencyCode: nullable → backfill → NOT NULL
ALTER TABLE "PriceListPrice" ADD COLUMN IF NOT EXISTS "currencyCode" "CurrencyCode";
UPDATE "PriceListPrice" plp
  SET "currencyCode" = pl."defaultCurrencyCode"
  FROM "PriceList" pl
  WHERE plp."priceListId" = pl."id" AND plp."currencyCode" IS NULL;
ALTER TABLE "PriceListPrice" ALTER COLUMN "currencyCode" SET NOT NULL;

-- Add unitOfMeasureId: nullable → backfill → NOT NULL
ALTER TABLE "PriceListPrice" ADD COLUMN IF NOT EXISTS "unitOfMeasureId" TEXT;
UPDATE "PriceListPrice"
  SET "unitOfMeasureId" = COALESCE(
    (SELECT "id" FROM "UnitOfMeasure" WHERE "code" = 'PC' LIMIT 1),
    'default_uom_pc'
  )
  WHERE "unitOfMeasureId" IS NULL;
ALTER TABLE "PriceListPrice" ALTER COLUMN "unitOfMeasureId" SET NOT NULL;

-- Add remaining columns
ALTER TABLE "PriceListPrice" ADD COLUMN IF NOT EXISTS "minQuantity" DECIMAL(65,30) NOT NULL DEFAULT 1;
ALTER TABLE "PriceListPrice" ADD COLUMN IF NOT EXISTS "maxQuantity" DECIMAL(65,30);
ALTER TABLE "PriceListPrice" ADD COLUMN IF NOT EXISTS "taxBehavior" "TaxBehavior" NOT NULL DEFAULT 'INCLUSIVE';
ALTER TABLE "PriceListPrice" ADD COLUMN IF NOT EXISTS "sourcePrice" DECIMAL(65,30);
ALTER TABLE "PriceListPrice" ADD COLUMN IF NOT EXISTS "sourceAppliedExchangeRate" DECIMAL(65,30);
ALTER TABLE "PriceListPrice" ADD COLUMN IF NOT EXISTS "lastRateComputedAt" TIMESTAMP(3);
ALTER TABLE "PriceListPrice" ADD COLUMN IF NOT EXISTS "validFrom" TIMESTAMP(3);
ALTER TABLE "PriceListPrice" ADD COLUMN IF NOT EXISTS "validTo" TIMESTAMP(3);
ALTER TABLE "PriceListPrice" ADD COLUMN IF NOT EXISTS "conditionType" TEXT;
ALTER TABLE "PriceListPrice" ADD COLUMN IF NOT EXISTS "isSourceLocked" BOOLEAN NOT NULL DEFAULT false;

-- New unique constraint and indexes
CREATE UNIQUE INDEX IF NOT EXISTS "PriceListPrice_priceListId_productVariantId_currencyCode_un_key"
  ON "PriceListPrice"("priceListId", "productVariantId", "currencyCode", "unitOfMeasureId", "minQuantity");
CREATE INDEX IF NOT EXISTS "PriceListPrice_validFrom_validTo_idx" ON "PriceListPrice"("validFrom", "validTo");

-- FK for unitOfMeasureId
DO $$ BEGIN
  ALTER TABLE "PriceListPrice" ADD CONSTRAINT "PriceListPrice_unitOfMeasureId_fkey"
    FOREIGN KEY ("unitOfMeasureId") REFERENCES "UnitOfMeasure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Drop PriceListCustomerGroup → Replace with PriceListAssignment
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE IF EXISTS "PriceListCustomerGroup" DROP CONSTRAINT IF EXISTS "PriceListCustomerGroup_customerGroupId_fkey";
ALTER TABLE IF EXISTS "PriceListCustomerGroup" DROP CONSTRAINT IF EXISTS "PriceListCustomerGroup_priceListId_fkey";
DROP TABLE IF EXISTS "PriceListCustomerGroup";

-- ═══════════════════════════════════════════════════════════════════════════════
-- Create PriceListAssignment
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "PriceListAssignment" (
    "id" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    "targetType" "AssignmentTargetType" NOT NULL,
    "customerGroupId" TEXT,
    "organizationId" TEXT,
    "customerId" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PriceListAssignment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PriceListAssignment_priceListId_idx" ON "PriceListAssignment"("priceListId");
CREATE INDEX IF NOT EXISTS "PriceListAssignment_targetType_idx" ON "PriceListAssignment"("targetType");
CREATE INDEX IF NOT EXISTS "PriceListAssignment_customerGroupId_idx" ON "PriceListAssignment"("customerGroupId");
CREATE INDEX IF NOT EXISTS "PriceListAssignment_organizationId_idx" ON "PriceListAssignment"("organizationId");
CREATE INDEX IF NOT EXISTS "PriceListAssignment_customerId_idx" ON "PriceListAssignment"("customerId");

-- Foreign Keys
DO $$ BEGIN
  ALTER TABLE "PriceListAssignment" ADD CONSTRAINT "PriceListAssignment_priceListId_fkey"
    FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "PriceListAssignment" ADD CONSTRAINT "PriceListAssignment_customerGroupId_fkey"
    FOREIGN KEY ("customerGroupId") REFERENCES "CustomerGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "PriceListAssignment" ADD CONSTRAINT "PriceListAssignment_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "PriceListAssignment" ADD CONSTRAINT "PriceListAssignment_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Partial Unique Indexes for PriceListAssignment
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE UNIQUE INDEX IF NOT EXISTS "PriceListAssignment_store_default_unique"
  ON "PriceListAssignment" ("priceListId")
  WHERE "targetType" = 'ALL_CUSTOMERS';

CREATE UNIQUE INDEX IF NOT EXISTS "PriceListAssignment_customer_group_unique"
  ON "PriceListAssignment" ("priceListId", "customerGroupId")
  WHERE "targetType" = 'CUSTOMER_GROUP';

CREATE UNIQUE INDEX IF NOT EXISTS "PriceListAssignment_organization_unique"
  ON "PriceListAssignment" ("priceListId", "organizationId")
  WHERE "targetType" = 'ORGANIZATION';

CREATE UNIQUE INDEX IF NOT EXISTS "PriceListAssignment_customer_unique"
  ON "PriceListAssignment" ("priceListId", "customerId")
  WHERE "targetType" = 'CUSTOMER';

-- ═══════════════════════════════════════════════════════════════════════════════
-- Data Cleanup (fix seed data that violates CHECK constraints)
-- ═══════════════════════════════════════════════════════════════════════════════

-- FIXED origin rows without a price → set price to 0
UPDATE "PriceListPrice" SET "price" = 0 WHERE "originType" = 'FIXED' AND "price" IS NULL;

-- RELATIVE origin rows without adjustment → set defaults
UPDATE "PriceListPrice" SET "adjustmentType" = 'PERCENTAGE', "adjustmentValue" = 0
  WHERE "originType" = 'RELATIVE' AND ("adjustmentType" IS NULL OR "adjustmentValue" IS NULL);

-- compareAtPrice < price → clear compareAtPrice
UPDATE "PriceListPrice" SET "compareAtPrice" = NULL
  WHERE "compareAtPrice" IS NOT NULL AND "price" IS NOT NULL AND "compareAtPrice" < "price";

-- ═══════════════════════════════════════════════════════════════════════════════
-- CHECK Constraints
-- ═══════════════════════════════════════════════════════════════════════════════

-- PriceListAssignment: targetType ↔ FK consistency
DO $$ BEGIN
  ALTER TABLE "PriceListAssignment" ADD CONSTRAINT "chk_assignment_target_fk"
    CHECK (
      CASE "targetType"
        WHEN 'ALL_CUSTOMERS'  THEN "customerGroupId" IS NULL AND "organizationId" IS NULL AND "customerId" IS NULL
        WHEN 'CUSTOMER_GROUP' THEN "customerGroupId" IS NOT NULL AND "organizationId" IS NULL AND "customerId" IS NULL
        WHEN 'ORGANIZATION'   THEN "organizationId" IS NOT NULL AND "customerGroupId" IS NULL AND "customerId" IS NULL
        WHEN 'CUSTOMER'       THEN "customerId" IS NOT NULL AND "customerGroupId" IS NULL AND "organizationId" IS NULL
      END
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PriceListPrice: maxQuantity >= minQuantity
DO $$ BEGIN
  ALTER TABLE "PriceListPrice" ADD CONSTRAINT "chk_quantity_range"
    CHECK ("maxQuantity" IS NULL OR "maxQuantity" >= "minQuantity");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PriceListPrice: FIXED origin → price required
DO $$ BEGIN
  ALTER TABLE "PriceListPrice" ADD CONSTRAINT "chk_fixed_has_price"
    CHECK ("originType" != 'FIXED' OR "price" IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PriceListPrice: RELATIVE origin → adjustmentType and adjustmentValue required
DO $$ BEGIN
  ALTER TABLE "PriceListPrice" ADD CONSTRAINT "chk_relative_has_adjustment"
    CHECK ("originType" != 'RELATIVE' OR ("adjustmentType" IS NOT NULL AND "adjustmentValue" IS NOT NULL));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PriceListPrice: compareAtPrice >= price
DO $$ BEGIN
  ALTER TABLE "PriceListPrice" ADD CONSTRAINT "chk_compare_at_price"
    CHECK ("compareAtPrice" IS NULL OR "price" IS NULL OR "compareAtPrice" >= "price");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PriceListPrice: row-level validity range
DO $$ BEGIN
  ALTER TABLE "PriceListPrice" ADD CONSTRAINT "chk_validity_range"
    CHECK ("validFrom" IS NULL OR "validTo" IS NULL OR "validTo" >= "validFrom");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PriceList: isExchangeRateDerived=true → sourceCurrencyCode required
DO $$ BEGIN
  ALTER TABLE "PriceList" ADD CONSTRAINT "chk_exchange_rate_derived"
    CHECK ("isExchangeRateDerived" = false OR "sourceCurrencyCode" IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PriceList: sourceCurrencyCode != defaultCurrencyCode
DO $$ BEGIN
  ALTER TABLE "PriceList" ADD CONSTRAINT "chk_exchange_rate_different_currency"
    CHECK ("sourceCurrencyCode" IS NULL OR "sourceCurrencyCode" != "defaultCurrencyCode");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PriceListPrice: sourcePrice requires sourceAppliedExchangeRate
DO $$ BEGIN
  ALTER TABLE "PriceListPrice" ADD CONSTRAINT "chk_source_price_has_rate"
    CHECK ("sourcePrice" IS NULL OR "sourceAppliedExchangeRate" IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Rename ExternalReference index (Prisma drift fix)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  ALTER INDEX "ExternalReference_sourceSystem_entityType_externalRef_externalS" RENAME TO "ExternalReference_sourceSystem_entityType_externalRef_exter_key";
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
