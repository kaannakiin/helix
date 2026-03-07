-- AlterTable
ALTER TABLE "platform_installations" ADD COLUMN     "currency" "CurrencyCode" NOT NULL DEFAULT 'TRY',
ADD COLUMN     "defaultLocale" "Locale" NOT NULL DEFAULT 'TR',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul';
