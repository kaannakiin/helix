/*
  Warnings:

  - You are about to drop the column `userId` on the `CustomerGroupMember` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `organization_members` table. All the data in the column will be lost.
  - You are about to drop the `store_members` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[customerGroupId,customerId]` on the table `CustomerGroupMember` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,customerId]` on the table `organization_members` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customerId` to the `organization_members` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CustomerGroupMember" DROP CONSTRAINT "CustomerGroupMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "organization_members" DROP CONSTRAINT "organization_members_userId_fkey";

-- DropForeignKey
ALTER TABLE "store_members" DROP CONSTRAINT "store_members_storeId_fkey";

-- DropForeignKey
ALTER TABLE "store_members" DROP CONSTRAINT "store_members_userId_fkey";

-- DropIndex
DROP INDEX "CustomerGroupMember_customerGroupId_userId_key";

-- DropIndex
DROP INDEX "CustomerGroupMember_userId_idx";

-- DropIndex
DROP INDEX "organization_members_organizationId_userId_key";

-- DropIndex
DROP INDEX "organization_members_userId_idx";

-- AlterTable
ALTER TABLE "CustomerGroupMember" DROP COLUMN "userId",
ADD COLUMN     "customerId" TEXT;

-- AlterTable
ALTER TABLE "organization_members" DROP COLUMN "userId",
ADD COLUMN     "customerId" TEXT NOT NULL;

-- DropTable
DROP TABLE "store_members";

-- CreateIndex
CREATE INDEX "CustomerGroupMember_customerId_idx" ON "CustomerGroupMember"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerGroupMember_customerGroupId_customerId_key" ON "CustomerGroupMember"("customerGroupId", "customerId");

-- CreateIndex
CREATE INDEX "organization_members_customerId_idx" ON "organization_members"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organizationId_customerId_key" ON "organization_members"("organizationId", "customerId");

-- AddForeignKey
ALTER TABLE "CustomerGroupMember" ADD CONSTRAINT "CustomerGroupMember_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
