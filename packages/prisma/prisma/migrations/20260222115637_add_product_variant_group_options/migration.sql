-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "productVariantGroupOptionId" TEXT;

-- CreateTable
CREATE TABLE "ProductVariantGroupOption" (
    "id" TEXT NOT NULL,
    "productVariantGroupId" TEXT NOT NULL,
    "variantOptionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "colorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVariantGroupOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductVariantGroupOption_productVariantGroupId_idx" ON "ProductVariantGroupOption"("productVariantGroupId");

-- CreateIndex
CREATE INDEX "ProductVariantGroupOption_variantOptionId_idx" ON "ProductVariantGroupOption"("variantOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantGroupOption_productVariantGroupId_variantOpti_key" ON "ProductVariantGroupOption"("productVariantGroupId", "variantOptionId");

-- CreateIndex
CREATE INDEX "Image_productVariantGroupOptionId_idx" ON "Image"("productVariantGroupOptionId");

-- CreateIndex
CREATE INDEX "Image_productVariantGroupOptionId_sortOrder_idx" ON "Image"("productVariantGroupOptionId", "sortOrder");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_productVariantGroupOptionId_fkey" FOREIGN KEY ("productVariantGroupOptionId") REFERENCES "ProductVariantGroupOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantGroupOption" ADD CONSTRAINT "ProductVariantGroupOption_productVariantGroupId_fkey" FOREIGN KEY ("productVariantGroupId") REFERENCES "ProductVariantGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantGroupOption" ADD CONSTRAINT "ProductVariantGroupOption_variantOptionId_fkey" FOREIGN KEY ("variantOptionId") REFERENCES "VariantOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
