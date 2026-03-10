-- ─── Store Multi-Currency Migration ──────────────────────────────────────────
-- Prisma generates CREATE TABLE for store_currencies and fx_rate_cache.
-- This file handles: RENAME, new tables (Prisma), backfill, triggers,
-- check constraints, and partial indexes that Prisma cannot express.
--
-- IMPORTANT: Backfill (step 3) runs BEFORE triggers (steps 4-6) are created,
-- so existing store rows don't fail the default-currency allowCheckout check.

-- ── Step 1: Rename stores.currency → stores.defaultCurrencyCode ──────────────
ALTER TABLE "stores" RENAME COLUMN "currency" TO "defaultCurrencyCode";

-- ── Step 2: Create store_currencies table (Prisma-generated DDL) ─────────────
CREATE TABLE "store_currencies" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "currencyCode" "CurrencyCode" NOT NULL,
    "isSelectable" BOOLEAN NOT NULL DEFAULT true,
    "allowCheckout" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_currencies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "store_currencies_storeId_currencyCode_key"
    ON "store_currencies"("storeId", "currencyCode");
CREATE INDEX "store_currencies_storeId_isSelectable_sortOrder_idx"
    ON "store_currencies"("storeId", "isSelectable", "sortOrder");
CREATE INDEX "store_currencies_storeId_currencyCode_allowCheckout_idx"
    ON "store_currencies"("storeId", "currencyCode", "allowCheckout");

ALTER TABLE "store_currencies"
    ADD CONSTRAINT "store_currencies_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "store_currencies"
    ADD CONSTRAINT "store_currencies_currencyCode_fkey"
    FOREIGN KEY ("currencyCode") REFERENCES "Currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── Step 3: Create fx_rate_cache table (Prisma-generated DDL) ─────────────────
CREATE TABLE "fx_rate_cache" (
    "id" TEXT NOT NULL,
    "baseCurrency" "CurrencyCode" NOT NULL,
    "quoteCurrency" "CurrencyCode" NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "source" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fx_rate_cache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "fx_rate_cache_baseCurrency_quoteCurrency_key"
    ON "fx_rate_cache"("baseCurrency", "quoteCurrency");
CREATE INDEX "fx_rate_cache_expiresAt_idx"
    ON "fx_rate_cache"("expiresAt");

-- ── Step 4: Update stores index for renamed column ────────────────────────────
CREATE INDEX "stores_defaultCurrencyCode_idx" ON "stores"("defaultCurrencyCode");

-- ── Step 5: Backfill store_currencies from stores.defaultCurrencyCode ─────────
-- Each existing store gets its current default currency as an active,
-- checkout-allowed, selectable policy row.
-- Runs BEFORE triggers so existing rows don't fail the allowCheckout check.
INSERT INTO "store_currencies" ("id", "storeId", "currencyCode", "isSelectable", "allowCheckout", "sortOrder", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    "id",
    "defaultCurrencyCode",
    true,
    true,
    0,
    NOW(),
    NOW()
FROM "stores"
ON CONFLICT ("storeId", "currencyCode") DO NOTHING;

-- ── Step 6: Trigger A — store_currencies INSERT/UPDATE ────────────────────────
-- Prevents setting allowCheckout=false on a store's default currency row.
CREATE OR REPLACE FUNCTION fn_check_sc_default_checkout()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."allowCheckout" = false AND EXISTS (
    SELECT 1 FROM "stores"
    WHERE "id" = NEW."storeId"
      AND "defaultCurrencyCode" = NEW."currencyCode"
  ) THEN
    RAISE EXCEPTION
      'Store default currency (%) must have allowCheckout=true (storeId: %)',
      NEW."currencyCode", NEW."storeId";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sc_default_checkout
BEFORE INSERT OR UPDATE OF "allowCheckout", "currencyCode" ON "store_currencies"
FOR EACH ROW EXECUTE FUNCTION fn_check_sc_default_checkout();

-- ── Step 7: Trigger B — stores.defaultCurrencyCode UPDATE ────────────────────
-- When changing the store's default currency, the new currency must already
-- exist in store_currencies with allowCheckout=true.
CREATE OR REPLACE FUNCTION fn_check_store_default_in_policy()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."defaultCurrencyCode" IS DISTINCT FROM OLD."defaultCurrencyCode" THEN
    IF NOT EXISTS (
      SELECT 1 FROM "store_currencies"
      WHERE "storeId" = NEW."id"
        AND "currencyCode" = NEW."defaultCurrencyCode"
        AND "allowCheckout" = true
    ) THEN
      RAISE EXCEPTION
        'defaultCurrencyCode (%) must exist in store_currencies with allowCheckout=true (storeId: %)',
        NEW."defaultCurrencyCode", NEW."id";
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_store_default_currency
BEFORE UPDATE OF "defaultCurrencyCode" ON "stores"
FOR EACH ROW EXECUTE FUNCTION fn_check_store_default_in_policy();

-- ── Step 8: Trigger C — store_currencies BEFORE DELETE ────────────────────────
-- Prevents deleting a store_currencies row that is the store's default currency.
-- Without this, the invariant can be broken by DELETE even though Trigger B
-- only fires on stores UPDATE.
CREATE OR REPLACE FUNCTION fn_prevent_default_sc_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "stores"
    WHERE "id" = OLD."storeId"
      AND "defaultCurrencyCode" = OLD."currencyCode"
  ) THEN
    RAISE EXCEPTION
      'Cannot delete store_currencies row: currency (%) is the default currency of store (%)',
      OLD."currencyCode", OLD."storeId";
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_default_sc_delete
BEFORE DELETE ON "store_currencies"
FOR EACH ROW EXECUTE FUNCTION fn_prevent_default_sc_delete();

-- ── Step 9: Trigger D — BASE price list currency immutability ─────────────────
-- Prevents changing defaultCurrencyCode on a BASE-type price list.
-- To change the currency, a new BASE list must be created instead.
CREATE OR REPLACE FUNCTION fn_immutable_base_price_list_currency()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."type" = 'BASE'
     AND NEW."defaultCurrencyCode" IS DISTINCT FROM OLD."defaultCurrencyCode" THEN
    RAISE EXCEPTION
      'Cannot change defaultCurrencyCode of a BASE price list (id: %). Create a new BASE list instead.',
      OLD."id";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_immutable_base_pl_currency
BEFORE UPDATE OF "defaultCurrencyCode" ON "PriceList"
FOR EACH ROW EXECUTE FUNCTION fn_immutable_base_price_list_currency();

-- ── Step 10: Trigger E — BASE price list type immutability ────────────────────
-- Prevents changing the type of a BASE price list (to or from BASE).
-- Closes the bypass: type=BASE → type=SALE → change currency → type=BASE again.
CREATE OR REPLACE FUNCTION fn_prevent_base_type_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."type" = 'BASE' AND NEW."type" != 'BASE' THEN
    RAISE EXCEPTION
      'Cannot change type of a BASE price list (id: %). BASE lists are permanent.',
      OLD."id";
  END IF;
  IF OLD."type" != 'BASE' AND NEW."type" = 'BASE' THEN
    RAISE EXCEPTION
      'Cannot promote a non-BASE price list to BASE (id: %). Create a new list.',
      OLD."id";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_base_type_change
BEFORE UPDATE OF "type" ON "PriceList"
FOR EACH ROW EXECUTE FUNCTION fn_prevent_base_type_change();

-- ── Step 11: Check constraints on PriceList ───────────────────────────────────
-- Rule 1: ERP-locked lists cannot use runtime FX derivation.
ALTER TABLE "PriceList"
  ADD CONSTRAINT "chk_no_derived_when_source_locked"
  CHECK (NOT ("isSourceLocked" = true AND "isExchangeRateDerived" = true));

-- Rule 2: If runtime FX derivation is enabled, sourceCurrencyCode is required.
ALTER TABLE "PriceList"
  ADD CONSTRAINT "chk_derived_requires_source_currency"
  CHECK (
    "isExchangeRateDerived" = false
    OR "sourceCurrencyCode" IS NOT NULL
  );

-- Rule 3: A price list cannot derive from its own default currency.
ALTER TABLE "PriceList"
  ADD CONSTRAINT "chk_source_currency_differs_from_default"
  CHECK (
    "sourceCurrencyCode" IS NULL
    OR "sourceCurrencyCode" != "defaultCurrencyCode"
  );

-- ── Step 12: Partial index for FX-derived active price lists ──────────────────
-- Cannot be expressed in Prisma schema — raw SQL only.
CREATE INDEX "PriceList_derived_active_idx"
    ON "PriceList"("storeId", "sourceCurrencyCode", "priority" DESC)
    WHERE "isExchangeRateDerived" = true
      AND "isActive" = true
      AND "status" = 'ACTIVE';
