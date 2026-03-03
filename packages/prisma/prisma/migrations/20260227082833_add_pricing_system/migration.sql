-- CreateEnum
CREATE TYPE "PriceListType" AS ENUM ('BASE', 'SALE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PriceListStatus" AS ENUM ('ACTIVE', 'DRAFT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PriceOriginType" AS ENUM ('FIXED', 'RELATIVE');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- AlterTable
ALTER TABLE "Currency" ADD COLUMN     "exchangeRate" DECIMAL(65,30) NOT NULL DEFAULT 1.0,
ADD COLUMN     "exchangeRateSource" TEXT,
ADD COLUMN     "exchangeRateUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PriceList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PriceListType" NOT NULL DEFAULT 'BASE',
    "status" "PriceListStatus" NOT NULL DEFAULT 'DRAFT',
    "currencyCode" "CurrencyCode" NOT NULL,
    "parentPriceListId" TEXT,
    "adjustmentType" "AdjustmentType",
    "adjustmentValue" DECIMAL(65,30),
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceListPrice" (
    "id" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "originType" "PriceOriginType" NOT NULL DEFAULT 'FIXED',
    "price" DECIMAL(65,30),
    "compareAtPrice" DECIMAL(65,30),
    "costPrice" DECIMAL(65,30),
    "adjustmentType" "AdjustmentType",
    "adjustmentValue" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceListPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceListCustomerGroup" (
    "id" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    "customerGroupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceListCustomerGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceList_currencyCode_idx" ON "PriceList"("currencyCode");

-- CreateIndex
CREATE INDEX "PriceList_type_currencyCode_idx" ON "PriceList"("type", "currencyCode");

-- CreateIndex
CREATE INDEX "PriceList_status_idx" ON "PriceList"("status");

-- CreateIndex
CREATE INDEX "PriceList_isActive_idx" ON "PriceList"("isActive");

-- CreateIndex
CREATE INDEX "PriceList_priority_idx" ON "PriceList"("priority");

-- CreateIndex
CREATE INDEX "PriceList_validFrom_validTo_idx" ON "PriceList"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "PriceList_parentPriceListId_idx" ON "PriceList"("parentPriceListId");

-- CreateIndex
CREATE INDEX "PriceListPrice_priceListId_idx" ON "PriceListPrice"("priceListId");

-- CreateIndex
CREATE INDEX "PriceListPrice_productVariantId_idx" ON "PriceListPrice"("productVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "PriceListPrice_priceListId_productVariantId_key" ON "PriceListPrice"("priceListId", "productVariantId");

-- CreateIndex
CREATE INDEX "PriceListCustomerGroup_priceListId_idx" ON "PriceListCustomerGroup"("priceListId");

-- CreateIndex
CREATE INDEX "PriceListCustomerGroup_customerGroupId_idx" ON "PriceListCustomerGroup"("customerGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "PriceListCustomerGroup_priceListId_customerGroupId_key" ON "PriceListCustomerGroup"("priceListId", "customerGroupId");

-- CreateIndex
CREATE INDEX "Currency_isDefault_idx" ON "Currency"("isDefault");

-- AddForeignKey
ALTER TABLE "PriceList" ADD CONSTRAINT "PriceList_parentPriceListId_fkey" FOREIGN KEY ("parentPriceListId") REFERENCES "PriceList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListPrice" ADD CONSTRAINT "PriceListPrice_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListPrice" ADD CONSTRAINT "PriceListPrice_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListCustomerGroup" ADD CONSTRAINT "PriceListCustomerGroup_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListCustomerGroup" ADD CONSTRAINT "PriceListCustomerGroup_customerGroupId_fkey" FOREIGN KEY ("customerGroupId") REFERENCES "CustomerGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
