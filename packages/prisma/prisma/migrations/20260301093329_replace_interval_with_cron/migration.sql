/*
  Warnings:

  - You are about to drop the column `evaluationIntervalMinutes` on the `CustomerGroup` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CustomerGroup" DROP COLUMN "evaluationIntervalMinutes",
ADD COLUMN     "cronExpression" TEXT DEFAULT '0 * * * *';
