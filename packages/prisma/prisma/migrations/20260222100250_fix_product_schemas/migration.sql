/*
  Warnings:

  - You are about to drop the column `slug` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `VariantGroup` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `VariantOption` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[locale,slug,productId]` on the table `ProductTranslation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `ProductTranslation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `VariantGroupTranslation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `VariantOptionTranslation` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Product_slug_idx";

-- DropIndex
DROP INDEX "Product_slug_key";

-- DropIndex
DROP INDEX "ProductTranslation_locale_idx";

-- DropIndex
DROP INDEX "VariantGroup_slug_idx";

-- DropIndex
DROP INDEX "VariantGroup_slug_key";

-- DropIndex
DROP INDEX "VariantOption_variantGroupId_slug_key";

-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "variantOptionId" TEXT;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "ProductTranslation" ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "VariantGroup" DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "VariantGroupTranslation" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "VariantOption" DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "VariantOptionTranslation" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Image_variantOptionId_idx" ON "Image"("variantOptionId");

-- CreateIndex
CREATE INDEX "Image_variantOptionId_sortOrder_idx" ON "Image"("variantOptionId", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductTranslation_locale_slug_idx" ON "ProductTranslation"("locale", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTranslation_locale_slug_productId_key" ON "ProductTranslation"("locale", "slug", "productId");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_variantOptionId_fkey" FOREIGN KEY ("variantOptionId") REFERENCES "VariantOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
