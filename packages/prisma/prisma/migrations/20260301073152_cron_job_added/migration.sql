-- AlterTable
ALTER TABLE "CustomerGroup" ADD COLUMN     "evaluationIntervalMinutes" INTEGER DEFAULT 1440,
ADD COLUMN     "lastEvaluatedAt" TIMESTAMP(3);
