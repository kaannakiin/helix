-- CreateEnum
CREATE TYPE "CountryType" AS ENUM ('HAS_STATES', 'HAS_CITIES_ONLY', 'COUNTRY_ONLY');

-- AlterTable
ALTER TABLE "Country" ADD COLUMN     "countryType" "CountryType" NOT NULL DEFAULT 'HAS_STATES';
