-- ============================================================================
-- Migration: add_store_scoping_and_category_sharing
--
-- 1. Add storeId to CustomerGroup, PriceList, RuleTree, Warehouse (safe pattern)
-- 2. Create CategoryStore junction table (categories become global/shared)
-- 3. Create ProductStore junction table
-- 4. Migrate existing Category.storeId data to category_stores
-- ============================================================================

-- Step 1: Add storeId columns as NULLABLE first
ALTER TABLE "CustomerGroup" ADD COLUMN "storeId" TEXT;
ALTER TABLE "PriceList" ADD COLUMN "storeId" TEXT;
ALTER TABLE "RuleTree" ADD COLUMN "storeId" TEXT;
ALTER TABLE "Warehouse" ADD COLUMN "storeId" TEXT;

-- Step 2: Assign default store to existing rows
UPDATE "CustomerGroup" SET "storeId" = 'store-b2b-merkez' WHERE "storeId" IS NULL;
UPDATE "PriceList" SET "storeId" = 'store-b2b-merkez' WHERE "storeId" IS NULL;
UPDATE "RuleTree" SET "storeId" = 'store-b2b-merkez' WHERE "storeId" IS NULL;
UPDATE "Warehouse" SET "storeId" = 'store-b2b-merkez' WHERE "storeId" IS NULL;

-- Step 3: Make storeId NOT NULL
ALTER TABLE "CustomerGroup" ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "PriceList" ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "RuleTree" ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "Warehouse" ALTER COLUMN "storeId" SET NOT NULL;

-- Step 4: Create CategoryStore junction table
CREATE TABLE "category_stores" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "category_stores_pkey" PRIMARY KEY ("id")
);

-- Step 5: Create ProductStore junction table
CREATE TABLE "product_stores" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_stores_pkey" PRIMARY KEY ("id")
);

-- Step 8: Create indexes
CREATE INDEX "category_stores_categoryId_idx" ON "category_stores"("categoryId");
CREATE INDEX "category_stores_storeId_idx" ON "category_stores"("storeId");
CREATE UNIQUE INDEX "category_stores_categoryId_storeId_key" ON "category_stores"("categoryId", "storeId");

CREATE INDEX "product_stores_productId_idx" ON "product_stores"("productId");
CREATE INDEX "product_stores_storeId_idx" ON "product_stores"("storeId");
CREATE UNIQUE INDEX "product_stores_productId_storeId_key" ON "product_stores"("productId", "storeId");

CREATE INDEX "CustomerGroup_storeId_idx" ON "CustomerGroup"("storeId");
CREATE INDEX "PriceList_storeId_idx" ON "PriceList"("storeId");
CREATE INDEX "RuleTree_storeId_idx" ON "RuleTree"("storeId");
CREATE INDEX "Warehouse_storeId_idx" ON "Warehouse"("storeId");

-- Step 9: Add foreign keys
ALTER TABLE "category_stores" ADD CONSTRAINT "category_stores_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "category_stores" ADD CONSTRAINT "category_stores_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CustomerGroup" ADD CONSTRAINT "CustomerGroup_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PriceList" ADD CONSTRAINT "PriceList_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_stores" ADD CONSTRAINT "product_stores_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_stores" ADD CONSTRAINT "product_stores_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RuleTree" ADD CONSTRAINT "RuleTree_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
