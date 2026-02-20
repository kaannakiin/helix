-- DropIndex
DROP INDEX IF EXISTS "RefreshToken_tokenHash_key";
DROP INDEX IF EXISTS "RefreshToken_tokenHash_idx";

-- CreateIndex
CREATE INDEX "RefreshToken_userId_family_isRevoked_createdAt_idx" ON "RefreshToken"("userId", "family", "isRevoked", "createdAt");

-- Revoke all existing tokens (SHA-256 hashes are incompatible with argon2)
UPDATE "RefreshToken" SET "isRevoked" = true WHERE "isRevoked" = false;
