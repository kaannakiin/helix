-- AlterTable
ALTER TABLE "PriceList" ADD COLUMN     "isSystemManaged" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "costPrice" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "defaultBasePriceListId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "stores_defaultBasePriceListId_key" ON "stores"("defaultBasePriceListId");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_defaultBasePriceListId_fkey" FOREIGN KEY ("defaultBasePriceListId") REFERENCES "PriceList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Data Migration: Create default base PriceList for each existing store
INSERT INTO "PriceList" ("id", "name", "storeId", "type", "status", "currencyCode", "priority", "isActive", "isSystemManaged", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  s."name" || ' - Default',
  s."id",
  'BASE',
  'ACTIVE',
  s."currency",
  0,
  true,
  true,
  NOW(),
  NOW()
FROM "stores" s
WHERE NOT EXISTS (
  SELECT 1 FROM "PriceList" pl
  WHERE pl."storeId" = s."id" AND pl."isSystemManaged" = true
);

-- Link default PriceList to Store
UPDATE "stores" s
SET "defaultBasePriceListId" = pl."id"
FROM "PriceList" pl
WHERE pl."storeId" = s."id"
  AND pl."isSystemManaged" = true
  AND s."defaultBasePriceListId" IS NULL;
