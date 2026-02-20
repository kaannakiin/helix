-- Turkish ICU collation for proper ö, ü, ç, ş, ğ, ı sorting
-- Uses PostgreSQL ICU provider (available since PG 12+)

-- User model: name, surname are the primary sort/search targets
ALTER TABLE "User" ALTER COLUMN "name" TYPE text COLLATE "tr-TR-x-icu";
ALTER TABLE "User" ALTER COLUMN "surname" TYPE text COLLATE "tr-TR-x-icu";

-- Recreate indexes on collated columns so they respect Turkish sort order
DROP INDEX IF EXISTS "User_email_idx";
DROP INDEX IF EXISTS "User_phone_idx";

CREATE INDEX "User_email_idx" ON "User" ("email");
CREATE INDEX "User_phone_idx" ON "User" ("phone");

-- Recreate indexes on name/surname with Turkish collation for ORDER BY
CREATE INDEX "User_name_idx" ON "User" ("name" COLLATE "tr-TR-x-icu");
CREATE INDEX "User_surname_idx" ON "User" ("surname" COLLATE "tr-TR-x-icu");
