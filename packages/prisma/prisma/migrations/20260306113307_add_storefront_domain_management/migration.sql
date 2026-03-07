-- CreateEnum
CREATE TYPE "StorefrontStatus" AS ENUM ('PENDING_HOST', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "InstallationStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "DomainOnboardingMode" AS ENUM ('EXACT_HOSTS', 'WILDCARD_DELEGATION', 'HYBRID');

-- CreateEnum
CREATE TYPE "DomainSpaceStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "HostBindingType" AS ENUM ('PRIMARY', 'ALIAS');

-- CreateEnum
CREATE TYPE "HostBindingStatus" AS ENUM ('PENDING_DNS', 'ACTIVE', 'FAILED', 'DISABLED');

-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "storefrontStatus" "StorefrontStatus" NOT NULL DEFAULT 'PENDING_HOST';

-- CreateTable
CREATE TABLE "platform_installations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "portalHostname" TEXT NOT NULL,
    "tlsAskSecret" TEXT NOT NULL,
    "status" "InstallationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_installations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installation_ingresses" (
    "id" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "canonicalTargetHost" TEXT,
    "ipv4Addresses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ipv6Addresses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installation_ingresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain_spaces" (
    "id" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "baseDomain" TEXT NOT NULL,
    "onboardingMode" "DomainOnboardingMode" NOT NULL DEFAULT 'HYBRID',
    "status" "DomainSpaceStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "verificationData" JSONB,
    "apexVerifiedAt" TIMESTAMP(3),
    "wildcardVerifiedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domain_spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_host_bindings" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "domainSpaceId" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "type" "HostBindingType" NOT NULL DEFAULT 'PRIMARY',
    "status" "HostBindingStatus" NOT NULL DEFAULT 'PENDING_DNS',
    "dnsInstructions" JSONB,
    "activatedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_host_bindings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_installations_portalHostname_key" ON "platform_installations"("portalHostname");

-- CreateIndex
CREATE UNIQUE INDEX "installation_ingresses_installationId_key" ON "installation_ingresses"("installationId");

-- CreateIndex
CREATE UNIQUE INDEX "domain_spaces_baseDomain_key" ON "domain_spaces"("baseDomain");

-- CreateIndex
CREATE INDEX "domain_spaces_installationId_idx" ON "domain_spaces"("installationId");

-- CreateIndex
CREATE INDEX "domain_spaces_status_idx" ON "domain_spaces"("status");

-- CreateIndex
CREATE UNIQUE INDEX "store_host_bindings_hostname_key" ON "store_host_bindings"("hostname");

-- CreateIndex
CREATE INDEX "store_host_bindings_storeId_idx" ON "store_host_bindings"("storeId");

-- CreateIndex
CREATE INDEX "store_host_bindings_domainSpaceId_idx" ON "store_host_bindings"("domainSpaceId");

-- CreateIndex
CREATE INDEX "store_host_bindings_status_idx" ON "store_host_bindings"("status");

-- CreateIndex
CREATE INDEX "stores_storefrontStatus_idx" ON "stores"("storefrontStatus");

-- AddForeignKey
ALTER TABLE "installation_ingresses" ADD CONSTRAINT "installation_ingresses_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "platform_installations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_spaces" ADD CONSTRAINT "domain_spaces_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "platform_installations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_host_bindings" ADD CONSTRAINT "store_host_bindings_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_host_bindings" ADD CONSTRAINT "store_host_bindings_domainSpaceId_fkey" FOREIGN KEY ("domainSpaceId") REFERENCES "domain_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
