-- ═══════════════════════════════════════════════════════════════════════════════
-- Pricing Guardrails Migration (idempotent)
-- D1: Race-safe name uniqueness per store (partial — excludes ARCHIVED)
-- D2: BASE type cannot have parent
-- D3: BASE type cannot have adjustments
-- D4: status/isActive coherence
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── D1: Partial unique index on (storeId, name) — only non-ARCHIVED ─────────
-- Allows reusing names once a price list is archived (e.g. "Q1 2026 Pricing").
-- Application-level findFirst check remains as a user-friendly error path.
DROP INDEX IF EXISTS "PriceList_storeId_name_key";
CREATE UNIQUE INDEX IF NOT EXISTS "PriceList_storeId_name_active_key"
  ON "PriceList"("storeId", "name")
  WHERE "status" != 'ARCHIVED';

-- ── D2: BASE price lists cannot have a parent ───────────────────────────────
-- BASE lists are top-level; inheritance is only for SALE/CUSTOM/CONTRACT.
DO $$ BEGIN
  ALTER TABLE "PriceList" ADD CONSTRAINT "chk_base_no_parent"
    CHECK ("type" != 'BASE' OR "parentPriceListId" IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── D3: BASE price lists cannot have list-level adjustments ─────────────────
-- Adjustments only make sense for inherited (child) price lists.
DO $$ BEGIN
  ALTER TABLE "PriceList" ADD CONSTRAINT "chk_base_no_adjustment"
    CHECK ("type" != 'BASE' OR ("adjustmentType" IS NULL AND "adjustmentValue" IS NULL));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── D4: status/isActive coherence ───────────────────────────────────────────
-- Only ACTIVE price lists may have isActive=true.
-- DRAFT and ARCHIVED must always have isActive=false.

-- Fix existing incoherent data first
UPDATE "PriceList" SET "isActive" = false WHERE "status" = 'ARCHIVED' AND "isActive" = true;
UPDATE "PriceList" SET "isActive" = false WHERE "status" = 'DRAFT' AND "isActive" = true;

DO $$ BEGIN
  ALTER TABLE "PriceList" ADD CONSTRAINT "chk_status_isactive_coherence"
    CHECK ("status" = 'ACTIVE' OR "isActive" = false);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── D5: Change isActive default to false (coherent with DRAFT default) ──────
ALTER TABLE "PriceList" ALTER COLUMN "isActive" SET DEFAULT false;
