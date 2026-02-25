-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "googleTaxonomyId" INTEGER;

-- CreateTable
CREATE TABLE "GoogleTaxonomy" (
    "id" INTEGER NOT NULL,
    "parentId" INTEGER,

    CONSTRAINT "GoogleTaxonomy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleTaxonomyTranslation" (
    "id" TEXT NOT NULL,
    "googleTaxonomyId" INTEGER NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,

    CONSTRAINT "GoogleTaxonomyTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoogleTaxonomy_parentId_idx" ON "GoogleTaxonomy"("parentId");

-- CreateIndex
CREATE INDEX "GoogleTaxonomyTranslation_googleTaxonomyId_idx" ON "GoogleTaxonomyTranslation"("googleTaxonomyId");

-- CreateIndex
CREATE INDEX "GoogleTaxonomyTranslation_locale_idx" ON "GoogleTaxonomyTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleTaxonomyTranslation_googleTaxonomyId_locale_key" ON "GoogleTaxonomyTranslation"("googleTaxonomyId", "locale");

-- CreateIndex
CREATE INDEX "Product_googleTaxonomyId_idx" ON "Product"("googleTaxonomyId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_googleTaxonomyId_fkey" FOREIGN KEY ("googleTaxonomyId") REFERENCES "GoogleTaxonomy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleTaxonomy" ADD CONSTRAINT "GoogleTaxonomy_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "GoogleTaxonomy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleTaxonomyTranslation" ADD CONSTRAINT "GoogleTaxonomyTranslation_googleTaxonomyId_fkey" FOREIGN KEY ("googleTaxonomyId") REFERENCES "GoogleTaxonomy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
