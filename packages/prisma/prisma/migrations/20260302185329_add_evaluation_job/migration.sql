-- CreateEnum
CREATE TYPE "EvaluationJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EvaluationTrigger" AS ENUM ('SCHEDULED', 'MANUAL');

-- CreateTable
CREATE TABLE "EvaluationJob" (
    "id" TEXT NOT NULL,
    "status" "EvaluationJobStatus" NOT NULL DEFAULT 'PENDING',
    "targetEntity" "RuleTargetEntity" NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "ruleTreeSnapshot" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "recordsEvaluated" INTEGER,
    "recordsMatched" INTEGER,
    "errorLog" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "bullJobId" TEXT,
    "triggeredBy" TEXT,
    "triggerType" "EvaluationTrigger" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EvaluationJob_status_idx" ON "EvaluationJob"("status");

-- CreateIndex
CREATE INDEX "EvaluationJob_entityId_entityType_idx" ON "EvaluationJob"("entityId", "entityType");

-- CreateIndex
CREATE INDEX "EvaluationJob_targetEntity_idx" ON "EvaluationJob"("targetEntity");

-- CreateIndex
CREATE INDEX "EvaluationJob_createdAt_idx" ON "EvaluationJob"("createdAt");
