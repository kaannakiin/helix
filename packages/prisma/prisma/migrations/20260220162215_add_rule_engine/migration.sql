-- CreateEnum
CREATE TYPE "RuleTargetEntity" AS ENUM ('USER', 'PRODUCT', 'ORDER');

-- CreateEnum
CREATE TYPE "CustomerGroupType" AS ENUM ('RULE_BASED', 'MANUAL');

-- DropIndex
DROP INDEX IF EXISTS "User_name_idx";

-- DropIndex
DROP INDEX IF EXISTS "User_surname_idx";

-- CreateTable
CREATE TABLE "RuleTree" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetEntity" "RuleTargetEntity" NOT NULL,
    "conditions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuleTree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "type" "CustomerGroupType" NOT NULL DEFAULT 'RULE_BASED',
    "ruleTreeId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerGroupMember" (
    "id" TEXT NOT NULL,
    "customerGroupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RuleTree_targetEntity_idx" ON "RuleTree"("targetEntity");

-- CreateIndex
CREATE INDEX "RuleTree_isActive_idx" ON "RuleTree"("isActive");

-- CreateIndex
CREATE INDEX "RuleTree_createdAt_idx" ON "RuleTree"("createdAt");

-- CreateIndex
CREATE INDEX "CustomerGroup_type_idx" ON "CustomerGroup"("type");

-- CreateIndex
CREATE INDEX "CustomerGroup_ruleTreeId_idx" ON "CustomerGroup"("ruleTreeId");

-- CreateIndex
CREATE INDEX "CustomerGroup_isActive_idx" ON "CustomerGroup"("isActive");

-- CreateIndex
CREATE INDEX "CustomerGroup_createdAt_idx" ON "CustomerGroup"("createdAt");

-- CreateIndex
CREATE INDEX "CustomerGroupMember_customerGroupId_idx" ON "CustomerGroupMember"("customerGroupId");

-- CreateIndex
CREATE INDEX "CustomerGroupMember_userId_idx" ON "CustomerGroupMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerGroupMember_customerGroupId_userId_key" ON "CustomerGroupMember"("customerGroupId", "userId");

-- AddForeignKey
ALTER TABLE "CustomerGroup" ADD CONSTRAINT "CustomerGroup_ruleTreeId_fkey" FOREIGN KEY ("ruleTreeId") REFERENCES "RuleTree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerGroupMember" ADD CONSTRAINT "CustomerGroupMember_customerGroupId_fkey" FOREIGN KEY ("customerGroupId") REFERENCES "CustomerGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerGroupMember" ADD CONSTRAINT "CustomerGroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
