-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'OTHER');

-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "fileType" "FileType" NOT NULL DEFAULT 'IMAGE';
