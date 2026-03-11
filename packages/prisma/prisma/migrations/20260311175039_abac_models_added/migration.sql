-- CreateTable
CREATE TABLE "user_store_access" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "allStores" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_store_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_store_assignments" (
    "id" TEXT NOT NULL,
    "storeAccessId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_store_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_capabilities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "capability" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_store_access_userId_key" ON "user_store_access"("userId");

-- CreateIndex
CREATE INDEX "user_store_access_userId_idx" ON "user_store_access"("userId");

-- CreateIndex
CREATE INDEX "user_store_assignments_storeAccessId_idx" ON "user_store_assignments"("storeAccessId");

-- CreateIndex
CREATE INDEX "user_store_assignments_storeId_idx" ON "user_store_assignments"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "user_store_assignments_storeAccessId_storeId_key" ON "user_store_assignments"("storeAccessId", "storeId");

-- CreateIndex
CREATE INDEX "user_capabilities_userId_idx" ON "user_capabilities"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_capabilities_userId_capability_key" ON "user_capabilities"("userId", "capability");

-- AddForeignKey
ALTER TABLE "user_store_access" ADD CONSTRAINT "user_store_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_store_assignments" ADD CONSTRAINT "user_store_assignments_storeAccessId_fkey" FOREIGN KEY ("storeAccessId") REFERENCES "user_store_access"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_store_assignments" ADD CONSTRAINT "user_store_assignments_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_capabilities" ADD CONSTRAINT "user_capabilities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
