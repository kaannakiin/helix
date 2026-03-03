-- DropIndex
DROP INDEX "Tag_tagGroupId_slug_key";

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "depth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "parentTagId" TEXT;

-- CreateIndex
CREATE INDEX "Tag_parentTagId_idx" ON "Tag"("parentTagId");

-- CreateIndex
CREATE INDEX "Tag_parentTagId_isActive_sortOrder_idx" ON "Tag"("parentTagId", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Tag_depth_idx" ON "Tag"("depth");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_tagGroupId_parentTagId_slug_key" ON "Tag"("tagGroupId", "parentTagId", "slug");

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_parentTagId_fkey" FOREIGN KEY ("parentTagId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;
