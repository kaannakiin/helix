/*
  Warnings:

  - The values [PENDING_VERIFICATION,ACTIVE] on the enum `DomainSpaceStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PENDING_DNS] on the enum `HostBindingStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `lastError` on the `domain_spaces` table. All the data in the column will be lost.
  - You are about to drop the column `verificationData` on the `domain_spaces` table. All the data in the column will be lost.
  - You are about to drop the column `dnsInstructions` on the `store_host_bindings` table. All the data in the column will be lost.
  - You are about to drop the column `lastError` on the `store_host_bindings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[wildcardProbeHost]` on the table `domain_spaces` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "DomainOwnershipMethod" AS ENUM ('TXT_TOKEN', 'DIRECT_DNS');

-- CreateEnum
CREATE TYPE "DomainRoutingMethod" AS ENUM ('HTTP_WELL_KNOWN', 'DIRECT_DNS');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'SKIPPED');

-- AlterEnum
BEGIN;
CREATE TYPE "DomainSpaceStatus_new" AS ENUM ('PENDING_OWNERSHIP', 'READY', 'FAILED', 'ARCHIVED');
ALTER TABLE "public"."domain_spaces" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "domain_spaces" ALTER COLUMN "status" TYPE "DomainSpaceStatus_new" USING ("status"::text::"DomainSpaceStatus_new");
ALTER TYPE "DomainSpaceStatus" RENAME TO "DomainSpaceStatus_old";
ALTER TYPE "DomainSpaceStatus_new" RENAME TO "DomainSpaceStatus";
DROP TYPE "public"."DomainSpaceStatus_old";
ALTER TABLE "domain_spaces" ALTER COLUMN "status" SET DEFAULT 'PENDING_OWNERSHIP';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "HostBindingStatus_new" AS ENUM ('PENDING_ROUTING', 'ACTIVE', 'FAILED', 'DISABLED');
ALTER TABLE "public"."store_host_bindings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "store_host_bindings" ALTER COLUMN "status" TYPE "HostBindingStatus_new" USING ("status"::text::"HostBindingStatus_new");
ALTER TYPE "HostBindingStatus" RENAME TO "HostBindingStatus_old";
ALTER TYPE "HostBindingStatus_new" RENAME TO "HostBindingStatus";
DROP TYPE "public"."HostBindingStatus_old";
ALTER TABLE "store_host_bindings" ALTER COLUMN "status" SET DEFAULT 'PENDING_ROUTING';
COMMIT;

-- AlterTable
ALTER TABLE "domain_spaces" DROP COLUMN "lastError",
DROP COLUMN "verificationData",
ADD COLUMN     "apexChallengeToken" TEXT,
ADD COLUMN     "apexRoutingLastError" TEXT,
ADD COLUMN     "apexRoutingMethod" "DomainRoutingMethod" NOT NULL DEFAULT 'HTTP_WELL_KNOWN',
ADD COLUMN     "apexRoutingStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "ownershipLastError" TEXT,
ADD COLUMN     "ownershipMethod" "DomainOwnershipMethod" NOT NULL DEFAULT 'TXT_TOKEN',
ADD COLUMN     "ownershipRecordName" TEXT,
ADD COLUMN     "ownershipRecordValue" TEXT,
ADD COLUMN     "ownershipStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "ownershipVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "wildcardChallengeToken" TEXT,
ADD COLUMN     "wildcardProbeHost" TEXT,
ADD COLUMN     "wildcardRoutingLastError" TEXT,
ADD COLUMN     "wildcardRoutingMethod" "DomainRoutingMethod" NOT NULL DEFAULT 'HTTP_WELL_KNOWN',
ADD COLUMN     "wildcardRoutingStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "status" SET DEFAULT 'PENDING_OWNERSHIP';

-- AlterTable
ALTER TABLE "store_host_bindings" DROP COLUMN "dnsInstructions",
DROP COLUMN "lastError",
ADD COLUMN     "challengeToken" TEXT,
ADD COLUMN     "routingLastError" TEXT,
ADD COLUMN     "routingMethod" "DomainRoutingMethod" NOT NULL DEFAULT 'HTTP_WELL_KNOWN',
ADD COLUMN     "routingStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "routingVerifiedAt" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'PENDING_ROUTING';

-- CreateIndex
CREATE UNIQUE INDEX "domain_spaces_wildcardProbeHost_key" ON "domain_spaces"("wildcardProbeHost");
