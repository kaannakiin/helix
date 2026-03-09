-- AlterTable
ALTER TABLE "organization_members" ADD COLUMN     "title" TEXT;

-- CreateTable
CREATE TABLE "org_member_closures" (
    "id" TEXT NOT NULL,
    "ancestorId" TEXT NOT NULL,
    "descendantId" TEXT NOT NULL,
    "depth" INTEGER NOT NULL,

    CONSTRAINT "org_member_closures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "org_member_closures_ancestorId_depth_idx" ON "org_member_closures"("ancestorId", "depth");

-- CreateIndex
CREATE INDEX "org_member_closures_descendantId_idx" ON "org_member_closures"("descendantId");

-- CreateIndex
CREATE UNIQUE INDEX "org_member_closures_ancestorId_descendantId_key" ON "org_member_closures"("ancestorId", "descendantId");

-- AddForeignKey
ALTER TABLE "org_member_closures" ADD CONSTRAINT "org_member_closures_ancestorId_fkey" FOREIGN KEY ("ancestorId") REFERENCES "organization_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_member_closures" ADD CONSTRAINT "org_member_closures_descendantId_fkey" FOREIGN KEY ("descendantId") REFERENCES "organization_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
