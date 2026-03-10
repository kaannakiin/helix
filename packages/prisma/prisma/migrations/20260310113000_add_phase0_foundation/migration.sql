-- CreateEnum
CREATE TYPE "BusinessReferenceType" AS ENUM (
  'PURCHASE_ORDER',
  'SALES_ORDER',
  'PURCHASE_RETURN',
  'SALES_RETURN',
  'STOCK_TRANSFER',
  'STOCK_COUNT',
  'MANUAL_ADJUSTMENT',
  'SHIPMENT',
  'INVOICE'
);

-- CreateEnum
CREATE TYPE "SourceSystem" AS ENUM (
  'INTERNAL',
  'SAP',
  'CANIAS',
  'WMS',
  'API',
  'CSV_IMPORT',
  'MANUAL_IMPORT'
);

-- CreateEnum
CREATE TYPE "DocumentNumberType" AS ENUM (
  'STOCK_MOVEMENT_GROUP',
  'SALES_ORDER',
  'PURCHASE_ORDER',
  'SHIPMENT',
  'RETURN',
  'INVOICE'
);

-- CreateEnum
CREATE TYPE "ExternalEntityType" AS ENUM (
  'PRODUCT_VARIANT',
  'PRICE_LIST',
  'PRICE_LIST_PRICE',
  'WAREHOUSE',
  'STOCK_MOVEMENT_GROUP',
  'CUSTOMER_GROUP',
  'SUPPLIER',
  'PURCHASE_ORDER',
  'SALES_ORDER'
);

-- AlterTable
ALTER TABLE "ProductVariant"
ADD COLUMN "costCurrencyCode" "CurrencyCode";

-- AlterTable
ALTER TABLE "StockMovement"
ALTER COLUMN "unitCost" TYPE DECIMAL(65,30)
USING CASE
  WHEN "unitCost" IS NULL THEN NULL
  ELSE "unitCost"::DECIMAL(65,30)
END;

-- AlterTable
ALTER TABLE "StockMovementGroup"
ALTER COLUMN "referenceType" TYPE "BusinessReferenceType"
USING CASE
  WHEN "referenceType" IS NULL THEN NULL
  WHEN "referenceType" = 'RETURN' THEN 'SALES_RETURN'
  ELSE "referenceType"
END::"BusinessReferenceType";

-- CreateTable
CREATE TABLE "ExternalReference" (
  "id" TEXT NOT NULL,
  "entityType" "ExternalEntityType" NOT NULL,
  "entityId" TEXT NOT NULL,
  "sourceSystem" "SourceSystem" NOT NULL,
  "externalRef" TEXT NOT NULL,
  "externalSubRef" TEXT NOT NULL DEFAULT '',
  "payloadHash" TEXT,
  "metadata" JSONB,
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ExternalReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NumberSeries" (
  "id" TEXT NOT NULL,
  "documentType" "DocumentNumberType" NOT NULL,
  "scopeKey" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "lastValue" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "NumberSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovementGroupStatusEvent" (
  "id" TEXT NOT NULL,
  "stockMovementGroupId" TEXT NOT NULL,
  "fromStatus" "StockMovementStatus",
  "toStatus" "StockMovementStatus" NOT NULL,
  "actorUserId" TEXT,
  "reason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StockMovementGroupStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExternalReference_sourceSystem_entityType_entityId_key"
ON "ExternalReference"("sourceSystem", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalReference_sourceSystem_entityType_externalRef_externalSubRef_key"
ON "ExternalReference"("sourceSystem", "entityType", "externalRef", "externalSubRef");

-- CreateIndex
CREATE INDEX "ExternalReference_entityType_entityId_idx"
ON "ExternalReference"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "NumberSeries_documentType_scopeKey_year_key"
ON "NumberSeries"("documentType", "scopeKey", "year");

-- CreateIndex
CREATE INDEX "StockMovementGroupStatusEvent_stockMovementGroupId_idx"
ON "StockMovementGroupStatusEvent"("stockMovementGroupId");

-- CreateIndex
CREATE INDEX "StockMovementGroupStatusEvent_actorUserId_idx"
ON "StockMovementGroupStatusEvent"("actorUserId");

-- CreateIndex
CREATE INDEX "StockMovementGroupStatusEvent_toStatus_idx"
ON "StockMovementGroupStatusEvent"("toStatus");

-- CreateIndex
CREATE INDEX "StockMovementGroupStatusEvent_createdAt_idx"
ON "StockMovementGroupStatusEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "StockMovementGroupStatusEvent"
ADD CONSTRAINT "StockMovementGroupStatusEvent_stockMovementGroupId_fkey"
FOREIGN KEY ("stockMovementGroupId") REFERENCES "StockMovementGroup"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovementGroupStatusEvent"
ADD CONSTRAINT "StockMovementGroupStatusEvent_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Data Migration: seed initial history rows for existing stock movement groups
INSERT INTO "StockMovementGroupStatusEvent" (
  "id",
  "stockMovementGroupId",
  "fromStatus",
  "toStatus",
  "actorUserId",
  "reason",
  "createdAt"
)
SELECT
  gen_random_uuid()::text,
  smg."id",
  NULL,
  smg."status",
  smg."performedById",
  'Backfilled initial status event',
  COALESCE(smg."postedAt", smg."createdAt")
FROM "StockMovementGroup" smg
WHERE NOT EXISTS (
  SELECT 1
  FROM "StockMovementGroupStatusEvent" ev
  WHERE ev."stockMovementGroupId" = smg."id"
);
