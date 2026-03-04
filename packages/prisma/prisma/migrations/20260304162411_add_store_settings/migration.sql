-- CreateTable
CREATE TABLE "store_settings" (
    "id" TEXT NOT NULL,
    "defaultLocale" "Locale" NOT NULL DEFAULT 'TR',
    "storeName" TEXT NOT NULL DEFAULT 'Helix Store',
    "currency" TEXT,
    "timezone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);
