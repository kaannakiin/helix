-- CreateEnum
CREATE TYPE "VariantGroupType" AS ENUM ('COLOR', 'SIZE');

-- CreateEnum
CREATE TYPE "VariantGroupDisplayMode" AS ENUM ('BADGE', 'SELECT', 'IMAGE_GRID');

-- AlterTable
ALTER TABLE "ProductVariantGroup" ADD COLUMN     "displayMode" "VariantGroupDisplayMode";

-- AlterTable
ALTER TABLE "VariantGroup" ADD COLUMN     "type" "VariantGroupType" NOT NULL DEFAULT 'SIZE';
