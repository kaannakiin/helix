-- CreateEnum
CREATE TYPE "WarehouseStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "BinType" AS ENUM ('STORAGE', 'RECEIVING', 'SHIPPING', 'QUALITY', 'DAMAGE', 'RETURN');

-- CreateEnum
CREATE TYPE "StockCategory" AS ENUM ('UNRESTRICTED', 'QUALITY_CHECK', 'BLOCKED', 'IN_TRANSIT', 'RESERVED');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('GOODS_RECEIPT', 'GOODS_RECEIPT_REVERSAL', 'GOODS_ISSUE', 'GOODS_ISSUE_REVERSAL', 'TRANSFER_OUT', 'TRANSFER_IN', 'STOCK_ADJUSTMENT_IN', 'STOCK_ADJUSTMENT_OUT', 'RETURN_FROM_CUSTOMER', 'RETURN_TO_SUPPLIER', 'QUALITY_RELEASE', 'QUALITY_BLOCK', 'SCRAP');

-- CreateEnum
CREATE TYPE "StockMovementStatus" AS ENUM ('DRAFT', 'POSTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TrackingStrategy" AS ENUM ('NONE', 'BATCH', 'SERIAL', 'BATCH_AND_SERIAL');

-- AlterEnum
ALTER TYPE "RuleTargetEntity" ADD VALUE 'INVENTORY';

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "trackingStrategy" "TrackingStrategy" NOT NULL DEFAULT 'NONE';

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "iso3" TEXT NOT NULL,
    "phoneCode" TEXT,
    "currency" TEXT,
    "currencyCode" TEXT,
    "currencySymbol" TEXT,
    "native" TEXT,
    "region" TEXT,
    "subregion" TEXT,
    "emoji" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CountryTranslation" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "State" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "native" TEXT,
    "stateCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StateTranslation" (
    "id" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StateTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cityCode" TEXT,
    "latitude" TEXT,
    "longitude" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" TEXT,
    "longitude" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Town" (
    "id" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Town_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockLevel" (
    "id" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "zoneId" TEXT,
    "binId" TEXT,
    "category" "StockCategory" NOT NULL DEFAULT 'UNRESTRICTED',
    "batchId" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reservedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availableQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitOfMeasureId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovementGroup" (
    "id" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "movementType" "MovementType" NOT NULL,
    "status" "StockMovementStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceWarehouseId" TEXT,
    "destWarehouseId" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "referenceNumber" TEXT,
    "performedById" TEXT,
    "note" TEXT,
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockMovementGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "sourceWarehouseId" TEXT,
    "sourceZoneId" TEXT,
    "sourceBinId" TEXT,
    "destWarehouseId" TEXT,
    "destZoneId" TEXT,
    "destBinId" TEXT,
    "fromCategory" "StockCategory",
    "toCategory" "StockCategory",
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitOfMeasureId" TEXT NOT NULL,
    "batchId" TEXT,
    "serialNumberId" TEXT,
    "unitCost" DOUBLE PRECISION,
    "currencyCode" "CurrencyCode",
    "snapshotQtyAfter" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "manufacturingDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "supplierBatchNo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SerialNumber" (
    "id" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "serialNo" TEXT NOT NULL,
    "batchId" TEXT,
    "currentWarehouseId" TEXT,
    "currentZoneId" TEXT,
    "currentBinId" TEXT,
    "isInStock" BOOLEAN NOT NULL DEFAULT true,
    "isScrapped" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SerialNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitOfMeasure" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitOfMeasure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitOfMeasureTranslation" (
    "id" TEXT NOT NULL,
    "unitOfMeasureId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitOfMeasureTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitConversion" (
    "id" TEXT NOT NULL,
    "fromUoMId" TEXT NOT NULL,
    "toUoMId" TEXT NOT NULL,
    "factor" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitConversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductUnitOfMeasure" (
    "id" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "unitOfMeasureId" TEXT NOT NULL,
    "isBase" BOOLEAN NOT NULL DEFAULT false,
    "conversionFactor" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "barcode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductUnitOfMeasure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "WarehouseStatus" NOT NULL DEFAULT 'ACTIVE',
    "countryId" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "cityId" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseTranslation" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseZone" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "parentZoneId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseZoneTranslation" (
    "id" TEXT NOT NULL,
    "warehouseZoneId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseZoneTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseBin" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "zoneId" TEXT,
    "code" TEXT NOT NULL,
    "binType" "BinType" NOT NULL DEFAULT 'STORAGE',
    "maxWeight" DOUBLE PRECISION,
    "maxVolume" DOUBLE PRECISION,
    "maxItems" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseBin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Country_iso3_key" ON "Country"("iso3");

-- CreateIndex
CREATE INDEX "Country_code_idx" ON "Country"("code");

-- CreateIndex
CREATE INDEX "Country_isActive_idx" ON "Country"("isActive");

-- CreateIndex
CREATE INDEX "Country_sortOrder_idx" ON "Country"("sortOrder");

-- CreateIndex
CREATE INDEX "CountryTranslation_countryId_idx" ON "CountryTranslation"("countryId");

-- CreateIndex
CREATE INDEX "CountryTranslation_locale_idx" ON "CountryTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "CountryTranslation_countryId_locale_key" ON "CountryTranslation"("countryId", "locale");

-- CreateIndex
CREATE INDEX "State_countryId_idx" ON "State"("countryId");

-- CreateIndex
CREATE INDEX "State_name_idx" ON "State"("name");

-- CreateIndex
CREATE INDEX "State_stateCode_idx" ON "State"("stateCode");

-- CreateIndex
CREATE INDEX "State_isActive_idx" ON "State"("isActive");

-- CreateIndex
CREATE INDEX "State_sortOrder_idx" ON "State"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "State_countryId_name_key" ON "State"("countryId", "name");

-- CreateIndex
CREATE INDEX "StateTranslation_stateId_idx" ON "StateTranslation"("stateId");

-- CreateIndex
CREATE INDEX "StateTranslation_locale_idx" ON "StateTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "StateTranslation_stateId_locale_key" ON "StateTranslation"("stateId", "locale");

-- CreateIndex
CREATE INDEX "City_stateId_idx" ON "City"("stateId");

-- CreateIndex
CREATE INDEX "City_countryId_idx" ON "City"("countryId");

-- CreateIndex
CREATE INDEX "City_name_idx" ON "City"("name");

-- CreateIndex
CREATE INDEX "City_isActive_idx" ON "City"("isActive");

-- CreateIndex
CREATE INDEX "City_sortOrder_idx" ON "City"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "City_stateId_name_key" ON "City"("stateId", "name");

-- CreateIndex
CREATE INDEX "District_cityId_idx" ON "District"("cityId");

-- CreateIndex
CREATE INDEX "District_countryId_idx" ON "District"("countryId");

-- CreateIndex
CREATE INDEX "District_stateId_idx" ON "District"("stateId");

-- CreateIndex
CREATE INDEX "District_name_idx" ON "District"("name");

-- CreateIndex
CREATE INDEX "District_isActive_idx" ON "District"("isActive");

-- CreateIndex
CREATE INDEX "District_sortOrder_idx" ON "District"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "District_cityId_name_key" ON "District"("cityId", "name");

-- CreateIndex
CREATE INDEX "Town_districtId_idx" ON "Town"("districtId");

-- CreateIndex
CREATE INDEX "Town_name_idx" ON "Town"("name");

-- CreateIndex
CREATE INDEX "Town_isActive_idx" ON "Town"("isActive");

-- CreateIndex
CREATE INDEX "Town_sortOrder_idx" ON "Town"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Town_districtId_name_key" ON "Town"("districtId", "name");

-- CreateIndex
CREATE INDEX "StockLevel_productVariantId_idx" ON "StockLevel"("productVariantId");

-- CreateIndex
CREATE INDEX "StockLevel_warehouseId_idx" ON "StockLevel"("warehouseId");

-- CreateIndex
CREATE INDEX "StockLevel_zoneId_idx" ON "StockLevel"("zoneId");

-- CreateIndex
CREATE INDEX "StockLevel_binId_idx" ON "StockLevel"("binId");

-- CreateIndex
CREATE INDEX "StockLevel_batchId_idx" ON "StockLevel"("batchId");

-- CreateIndex
CREATE INDEX "StockLevel_category_idx" ON "StockLevel"("category");

-- CreateIndex
CREATE INDEX "StockLevel_productVariantId_warehouseId_idx" ON "StockLevel"("productVariantId", "warehouseId");

-- CreateIndex
CREATE INDEX "StockLevel_availableQty_idx" ON "StockLevel"("availableQty");

-- CreateIndex
CREATE UNIQUE INDEX "StockLevel_productVariantId_warehouseId_zoneId_binId_catego_key" ON "StockLevel"("productVariantId", "warehouseId", "zoneId", "binId", "category", "batchId");

-- CreateIndex
CREATE UNIQUE INDEX "StockMovementGroup_documentNumber_key" ON "StockMovementGroup"("documentNumber");

-- CreateIndex
CREATE INDEX "StockMovementGroup_documentNumber_idx" ON "StockMovementGroup"("documentNumber");

-- CreateIndex
CREATE INDEX "StockMovementGroup_movementType_idx" ON "StockMovementGroup"("movementType");

-- CreateIndex
CREATE INDEX "StockMovementGroup_status_idx" ON "StockMovementGroup"("status");

-- CreateIndex
CREATE INDEX "StockMovementGroup_sourceWarehouseId_idx" ON "StockMovementGroup"("sourceWarehouseId");

-- CreateIndex
CREATE INDEX "StockMovementGroup_destWarehouseId_idx" ON "StockMovementGroup"("destWarehouseId");

-- CreateIndex
CREATE INDEX "StockMovementGroup_performedById_idx" ON "StockMovementGroup"("performedById");

-- CreateIndex
CREATE INDEX "StockMovementGroup_referenceType_referenceId_idx" ON "StockMovementGroup"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "StockMovementGroup_postedAt_idx" ON "StockMovementGroup"("postedAt");

-- CreateIndex
CREATE INDEX "StockMovementGroup_createdAt_idx" ON "StockMovementGroup"("createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_groupId_idx" ON "StockMovement"("groupId");

-- CreateIndex
CREATE INDEX "StockMovement_productVariantId_idx" ON "StockMovement"("productVariantId");

-- CreateIndex
CREATE INDEX "StockMovement_sourceWarehouseId_idx" ON "StockMovement"("sourceWarehouseId");

-- CreateIndex
CREATE INDEX "StockMovement_destWarehouseId_idx" ON "StockMovement"("destWarehouseId");

-- CreateIndex
CREATE INDEX "StockMovement_batchId_idx" ON "StockMovement"("batchId");

-- CreateIndex
CREATE INDEX "StockMovement_serialNumberId_idx" ON "StockMovement"("serialNumberId");

-- CreateIndex
CREATE INDEX "StockMovement_productVariantId_createdAt_idx" ON "StockMovement"("productVariantId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

-- CreateIndex
CREATE INDEX "Batch_productVariantId_idx" ON "Batch"("productVariantId");

-- CreateIndex
CREATE INDEX "Batch_batchNumber_idx" ON "Batch"("batchNumber");

-- CreateIndex
CREATE INDEX "Batch_expirationDate_idx" ON "Batch"("expirationDate");

-- CreateIndex
CREATE INDEX "Batch_isActive_idx" ON "Batch"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_productVariantId_batchNumber_key" ON "Batch"("productVariantId", "batchNumber");

-- CreateIndex
CREATE INDEX "SerialNumber_productVariantId_idx" ON "SerialNumber"("productVariantId");

-- CreateIndex
CREATE INDEX "SerialNumber_serialNo_idx" ON "SerialNumber"("serialNo");

-- CreateIndex
CREATE INDEX "SerialNumber_batchId_idx" ON "SerialNumber"("batchId");

-- CreateIndex
CREATE INDEX "SerialNumber_currentWarehouseId_idx" ON "SerialNumber"("currentWarehouseId");

-- CreateIndex
CREATE INDEX "SerialNumber_isInStock_idx" ON "SerialNumber"("isInStock");

-- CreateIndex
CREATE UNIQUE INDEX "SerialNumber_productVariantId_serialNo_key" ON "SerialNumber"("productVariantId", "serialNo");

-- CreateIndex
CREATE UNIQUE INDEX "UnitOfMeasure_code_key" ON "UnitOfMeasure"("code");

-- CreateIndex
CREATE INDEX "UnitOfMeasure_code_idx" ON "UnitOfMeasure"("code");

-- CreateIndex
CREATE INDEX "UnitOfMeasure_isActive_idx" ON "UnitOfMeasure"("isActive");

-- CreateIndex
CREATE INDEX "UnitOfMeasure_sortOrder_idx" ON "UnitOfMeasure"("sortOrder");

-- CreateIndex
CREATE INDEX "UnitOfMeasureTranslation_unitOfMeasureId_idx" ON "UnitOfMeasureTranslation"("unitOfMeasureId");

-- CreateIndex
CREATE INDEX "UnitOfMeasureTranslation_locale_idx" ON "UnitOfMeasureTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "UnitOfMeasureTranslation_unitOfMeasureId_locale_key" ON "UnitOfMeasureTranslation"("unitOfMeasureId", "locale");

-- CreateIndex
CREATE INDEX "UnitConversion_fromUoMId_idx" ON "UnitConversion"("fromUoMId");

-- CreateIndex
CREATE INDEX "UnitConversion_toUoMId_idx" ON "UnitConversion"("toUoMId");

-- CreateIndex
CREATE UNIQUE INDEX "UnitConversion_fromUoMId_toUoMId_key" ON "UnitConversion"("fromUoMId", "toUoMId");

-- CreateIndex
CREATE INDEX "ProductUnitOfMeasure_productVariantId_idx" ON "ProductUnitOfMeasure"("productVariantId");

-- CreateIndex
CREATE INDEX "ProductUnitOfMeasure_unitOfMeasureId_idx" ON "ProductUnitOfMeasure"("unitOfMeasureId");

-- CreateIndex
CREATE INDEX "ProductUnitOfMeasure_productVariantId_isBase_idx" ON "ProductUnitOfMeasure"("productVariantId", "isBase");

-- CreateIndex
CREATE UNIQUE INDEX "ProductUnitOfMeasure_productVariantId_unitOfMeasureId_key" ON "ProductUnitOfMeasure"("productVariantId", "unitOfMeasureId");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_slug_key" ON "Warehouse"("slug");

-- CreateIndex
CREATE INDEX "Warehouse_code_idx" ON "Warehouse"("code");

-- CreateIndex
CREATE INDEX "Warehouse_slug_idx" ON "Warehouse"("slug");

-- CreateIndex
CREATE INDEX "Warehouse_status_idx" ON "Warehouse"("status");

-- CreateIndex
CREATE INDEX "Warehouse_countryId_idx" ON "Warehouse"("countryId");

-- CreateIndex
CREATE INDEX "Warehouse_stateId_idx" ON "Warehouse"("stateId");

-- CreateIndex
CREATE INDEX "Warehouse_cityId_idx" ON "Warehouse"("cityId");

-- CreateIndex
CREATE INDEX "Warehouse_sortOrder_idx" ON "Warehouse"("sortOrder");

-- CreateIndex
CREATE INDEX "WarehouseTranslation_warehouseId_idx" ON "WarehouseTranslation"("warehouseId");

-- CreateIndex
CREATE INDEX "WarehouseTranslation_locale_idx" ON "WarehouseTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseTranslation_warehouseId_locale_key" ON "WarehouseTranslation"("warehouseId", "locale");

-- CreateIndex
CREATE INDEX "WarehouseZone_warehouseId_idx" ON "WarehouseZone"("warehouseId");

-- CreateIndex
CREATE INDEX "WarehouseZone_parentZoneId_idx" ON "WarehouseZone"("parentZoneId");

-- CreateIndex
CREATE INDEX "WarehouseZone_isActive_idx" ON "WarehouseZone"("isActive");

-- CreateIndex
CREATE INDEX "WarehouseZone_sortOrder_idx" ON "WarehouseZone"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseZone_warehouseId_code_key" ON "WarehouseZone"("warehouseId", "code");

-- CreateIndex
CREATE INDEX "WarehouseZoneTranslation_warehouseZoneId_idx" ON "WarehouseZoneTranslation"("warehouseZoneId");

-- CreateIndex
CREATE INDEX "WarehouseZoneTranslation_locale_idx" ON "WarehouseZoneTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseZoneTranslation_warehouseZoneId_locale_key" ON "WarehouseZoneTranslation"("warehouseZoneId", "locale");

-- CreateIndex
CREATE INDEX "WarehouseBin_warehouseId_idx" ON "WarehouseBin"("warehouseId");

-- CreateIndex
CREATE INDEX "WarehouseBin_zoneId_idx" ON "WarehouseBin"("zoneId");

-- CreateIndex
CREATE INDEX "WarehouseBin_binType_idx" ON "WarehouseBin"("binType");

-- CreateIndex
CREATE INDEX "WarehouseBin_isActive_idx" ON "WarehouseBin"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseBin_warehouseId_code_key" ON "WarehouseBin"("warehouseId", "code");

-- AddForeignKey
ALTER TABLE "CountryTranslation" ADD CONSTRAINT "CountryTranslation_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "State" ADD CONSTRAINT "State_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StateTranslation" ADD CONSTRAINT "StateTranslation_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Town" ADD CONSTRAINT "Town_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "WarehouseZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_binId_fkey" FOREIGN KEY ("binId") REFERENCES "WarehouseBin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_unitOfMeasureId_fkey" FOREIGN KEY ("unitOfMeasureId") REFERENCES "UnitOfMeasure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovementGroup" ADD CONSTRAINT "StockMovementGroup_sourceWarehouseId_fkey" FOREIGN KEY ("sourceWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovementGroup" ADD CONSTRAINT "StockMovementGroup_destWarehouseId_fkey" FOREIGN KEY ("destWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovementGroup" ADD CONSTRAINT "StockMovementGroup_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StockMovementGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_unitOfMeasureId_fkey" FOREIGN KEY ("unitOfMeasureId") REFERENCES "UnitOfMeasure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_serialNumberId_fkey" FOREIGN KEY ("serialNumberId") REFERENCES "SerialNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerialNumber" ADD CONSTRAINT "SerialNumber_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerialNumber" ADD CONSTRAINT "SerialNumber_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitOfMeasureTranslation" ADD CONSTRAINT "UnitOfMeasureTranslation_unitOfMeasureId_fkey" FOREIGN KEY ("unitOfMeasureId") REFERENCES "UnitOfMeasure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitConversion" ADD CONSTRAINT "UnitConversion_fromUoMId_fkey" FOREIGN KEY ("fromUoMId") REFERENCES "UnitOfMeasure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitConversion" ADD CONSTRAINT "UnitConversion_toUoMId_fkey" FOREIGN KEY ("toUoMId") REFERENCES "UnitOfMeasure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductUnitOfMeasure" ADD CONSTRAINT "ProductUnitOfMeasure_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductUnitOfMeasure" ADD CONSTRAINT "ProductUnitOfMeasure_unitOfMeasureId_fkey" FOREIGN KEY ("unitOfMeasureId") REFERENCES "UnitOfMeasure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseTranslation" ADD CONSTRAINT "WarehouseTranslation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseZone" ADD CONSTRAINT "WarehouseZone_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseZone" ADD CONSTRAINT "WarehouseZone_parentZoneId_fkey" FOREIGN KEY ("parentZoneId") REFERENCES "WarehouseZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseZoneTranslation" ADD CONSTRAINT "WarehouseZoneTranslation_warehouseZoneId_fkey" FOREIGN KEY ("warehouseZoneId") REFERENCES "WarehouseZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseBin" ADD CONSTRAINT "WarehouseBin_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseBin" ADD CONSTRAINT "WarehouseBin_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "WarehouseZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

