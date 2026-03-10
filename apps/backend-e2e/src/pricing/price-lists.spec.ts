import { createId } from '@paralleldrive/cuid2';
import type { AxiosInstance } from 'axios';
import { createAdminClient } from '../support/admin.helper.js';
import {
  createPricingStore,
  createProductWithVariants as createProductWithVariantsRaw,
  prisma,
  resetPricingFixtures,
  uniqueSuffix,
} from '../support/prisma.helper.js';
const API = '/api/admin/price-lists';

function buildPayload(
  storeId: string,
  overrides: Record<string, unknown> = {}
) {
  const suffix = uniqueSuffix();
  return {
    uniqueId: createId(),
    name: `PL ${suffix}`,
    storeId,
    type: 'BASE' as const,
    status: 'DRAFT' as const,
    defaultCurrencyCode: 'TRY',
    parentPriceListId: null,
    adjustmentType: null,
    adjustmentValue: null,
    validFrom: null,
    validTo: null,
    priority: 0,
    description: null,
    isActive: true,
    prices: [],
    isExchangeRateDerived: false,
    sourceCurrencyCode: null,
    roundingRule: 'NONE',
    ...overrides,
  };
}

/** Helper to create a price list and return its data */
async function createPL(
  client: AxiosInstance,
  storeId: string,
  overrides: Record<string, unknown> = {}
) {
  const payload = buildPayload(storeId, overrides);
  const res = await client.post(`${API}/save`, payload);
  expect(res.status).toBe(201);
  return { payload, data: res.data, id: res.data.id as string };
}

/** Helper to update an existing price list */
async function updatePL(
  client: AxiosInstance,
  id: string,
  storeId: string,
  overrides: Record<string, unknown> = {}
) {
  const payload = buildPayload(storeId, overrides);
  return client.post(`${API}/save`, { ...payload, uniqueId: id });
}

/** Seed a FIXED price row directly via Prisma */
async function seedPriceRow(
  priceListId: string,
  variantId: string,
  uomId: string,
  price: number | null = 100
) {
  return prisma.priceListPrice.create({
    data: {
      priceList: { connect: { id: priceListId } },
      productVariant: { connect: { id: variantId } },
      unitOfMeasure: { connect: { id: uomId } },
      currencyCode: 'TRY',
      originType: 'FIXED',
      price,
      minQuantity: 1,
    },
  });
}

/** Create product with variants and return typed result */
async function seedProductWithVariants(storeId: string, suffix: string) {
  const result = await createProductWithVariantsRaw(storeId, suffix);
  return result as {
    product: { id: string };
    variants: { id: string; sku: string }[];
    uom: { id: string };
  };
}

describe('Pricing — Price Lists', () => {
  let client: AxiosInstance;
  let storeA: { id: string };
  let storeB: { id: string };

  beforeAll(async () => {
    await prisma.$connect();
    await resetPricingFixtures();

    const admin = await createAdminClient();
    client = admin.client;

    const fixtureA = await createPricingStore(uniqueSuffix());
    storeA = fixtureA.store;

    const fixtureB = await createPricingStore(uniqueSuffix());
    storeB = fixtureB.store;
  });

  afterAll(async () => {
    await resetPricingFixtures();
    await prisma.$disconnect();
  });

  // ─── CRUD ────────────────────────────────────────────────────────

  describe('Price List CRUD', () => {
    it('creates a DRAFT price list', async () => {
      const { data, payload } = await createPL(client, storeA.id);

      expect(data.id).toBeDefined();
      expect(data.name).toBe(payload.name);
      expect(data.status).toBe('DRAFT');
      expect(data.type).toBe('BASE');
      expect(data.defaultCurrencyCode).toBe('TRY');
    });

    it('retrieves a price list by ID', async () => {
      const { id, payload } = await createPL(client, storeA.id);

      const res = await client.get(`${API}/${id}`);
      expect(res.status).toBe(200);
      expect(res.data.id).toBe(id);
      expect(res.data.name).toBe(payload.name);
    });

    it('returns 404 for non-existent ID', async () => {
      const res = await client.get(`${API}/clxxxxxxxxxxxxxxxxxxxxxxxxx`);
      expect(res.status).toBe(404);
    });

    it('updates an existing price list', async () => {
      const { id } = await createPL(client, storeA.id);

      const res = await updatePL(client, id, storeA.id, {
        description: 'Updated description',
      });
      expect(res.status).toBe(200);
      expect(res.data.description).toBe('Updated description');
    });

    it('queries price lists with pagination', async () => {
      const res = await client.post(`${API}/query`, {
        page: 1,
        limit: 10,
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.pagination).toBeDefined();
      expect(res.data.pagination.total).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── S2: Name uniqueness ────────────────────────────────────────

  describe('Name uniqueness (S2)', () => {
    it('rejects duplicate name in same store', async () => {
      const name = `Unique-${uniqueSuffix()}`;
      await createPL(client, storeA.id, { name });

      const res = await client.post(
        `${API}/save`,
        buildPayload(storeA.id, { name })
      );
      expect(res.status).toBe(409);
    });

    it('allows same name if existing is ARCHIVED', async () => {
      const name = `Archived-${uniqueSuffix()}`;
      const { id } = await createPL(client, storeA.id, { name });

      // Archive directly via Prisma (skip status transition validation)
      await prisma.priceList.update({
        where: { id },
        data: { status: 'ARCHIVED', isActive: false },
      });

      const res = await client.post(
        `${API}/save`,
        buildPayload(storeA.id, { name })
      );
      expect(res.status).toBe(201);
    });

    it('allows same name in different store', async () => {
      const name = `CrossStore-${uniqueSuffix()}`;
      await createPL(client, storeA.id, { name });

      const res = await client.post(
        `${API}/save`,
        buildPayload(storeB.id, { name })
      );
      expect(res.status).toBe(201);
    });
  });

  // ─── S0: Ownership guard ────────────────────────────────────────

  describe('Ownership guard (S0)', () => {
    it('rejects update when storeId differs from existing record', async () => {
      const { id } = await createPL(client, storeA.id);

      const res = await updatePL(client, id, storeB.id);
      expect(res.status).toBe(403);
    });
  });

  // ─── S3/S4: Parent validation ───────────────────────────────────

  describe('Parent price list validation (S3/S4)', () => {
    it('accepts valid parent in same store', async () => {
      const parent = await createPL(client, storeA.id);

      const res = await client.post(
        `${API}/save`,
        buildPayload(storeA.id, {
          type: 'SALE',
          parentPriceListId: parent.id,
        })
      );
      expect(res.status).toBe(201);
      expect(res.data.parentPriceListId).toBe(parent.id);
    });

    it('rejects non-existent parent', async () => {
      const res = await client.post(
        `${API}/save`,
        buildPayload(storeA.id, {
          type: 'SALE',
          parentPriceListId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        })
      );
      expect(res.status).toBe(404);
    });

    it('rejects parent from different store', async () => {
      const parentInB = await createPL(client, storeB.id);

      const res = await client.post(
        `${API}/save`,
        buildPayload(storeA.id, {
          type: 'SALE',
          parentPriceListId: parentInB.id,
        })
      );
      expect(res.status).toBe(400);
    });

    it('detects circular parent chain', async () => {
      const plA = await createPL(client, storeA.id, { type: 'SALE' });
      await createPL(client, storeA.id, {
        type: 'SALE',
        parentPriceListId: plA.id,
      });
      const plB = await createPL(client, storeA.id, {
        type: 'SALE',
        parentPriceListId: plA.id,
      });

      // Try to make A's parent = B (creates A→B→A cycle)
      const res = await updatePL(client, plA.id, storeA.id, {
        type: 'SALE',
        parentPriceListId: plB.id,
      });
      expect(res.status).toBe(400);
    });
  });

  // ─── S5: Source-locked ──────────────────────────────────────────

  describe('Source-locked price lists (S5)', () => {
    it('allows changing status on source-locked list', async () => {
      const { id } = await createPL(client, storeA.id);
      await prisma.priceList.update({
        where: { id },
        data: { isSourceLocked: true },
      });

      // DRAFT → ARCHIVED is a valid transition
      const res = await updatePL(client, id, storeA.id, {
        status: 'ARCHIVED',
      });
      expect(res.status).toBe(200);
    });

    it('rejects changing name on source-locked list', async () => {
      const { id } = await createPL(client, storeA.id);
      await prisma.priceList.update({
        where: { id },
        data: { isSourceLocked: true },
      });

      const res = await updatePL(client, id, storeA.id, {
        name: 'New Name',
      });
      expect(res.status).toBe(400);
    });
  });

  // ─── S6: System-managed ─────────────────────────────────────────

  describe('System-managed price lists (S6)', () => {
    it('rejects changing type on system-managed list', async () => {
      const { id } = await createPL(client, storeA.id);
      await prisma.priceList.update({
        where: { id },
        data: { isSystemManaged: true },
      });

      const res = await updatePL(client, id, storeA.id, { type: 'SALE' });
      expect(res.status).toBe(400);
    });

    it('allows changing description on system-managed list', async () => {
      const { id } = await createPL(client, storeA.id);
      await prisma.priceList.update({
        where: { id },
        data: { isSystemManaged: true },
      });

      const res = await updatePL(client, id, storeA.id, {
        description: 'Allowed change',
      });
      expect(res.status).toBe(200);
      expect(res.data.description).toBe('Allowed change');
    });
  });

  // ─── S7: Status transitions ─────────────────────────────────────

  describe('Status transitions (S7)', () => {
    it('DRAFT → ARCHIVED succeeds', async () => {
      const { id } = await createPL(client, storeA.id);

      const res = await updatePL(client, id, storeA.id, {
        status: 'ARCHIVED',
      });
      expect(res.status).toBe(200);
      expect(res.data.status).toBe('ARCHIVED');
    });

    it('DRAFT → ACTIVE succeeds when prerequisites are met', async () => {
      const suffix = uniqueSuffix();
      const { id: plId } = await createPL(client, storeA.id, {
        name: `Activate-${suffix}`,
      });

      const { variants, uom } = await seedProductWithVariants(
        storeA.id,
        suffix
      );
      await seedPriceRow(plId, variants[0].id, uom.id);

      const res = await updatePL(client, plId, storeA.id, {
        status: 'ACTIVE',
        name: `Activate-${suffix}`,
      });
      expect(res.status).toBe(200);
      expect(res.data.status).toBe('ACTIVE');
      expect(res.data.isActive).toBe(true);
    });

    it('ACTIVE → ARCHIVED succeeds', async () => {
      const suffix = uniqueSuffix();
      const { id: plId } = await createPL(client, storeA.id, {
        name: `ToArchive-${suffix}`,
      });

      const { variants, uom } = await seedProductWithVariants(
        storeA.id,
        suffix
      );
      await seedPriceRow(plId, variants[0].id, uom.id, 50);

      // Activate first
      await updatePL(client, plId, storeA.id, {
        status: 'ACTIVE',
        name: `ToArchive-${suffix}`,
      });

      // Now archive
      const res = await updatePL(client, plId, storeA.id, {
        status: 'ARCHIVED',
        name: `ToArchive-${suffix}`,
      });
      expect(res.status).toBe(200);
      expect(res.data.status).toBe('ARCHIVED');
    });

    it('ARCHIVED → DRAFT is rejected', async () => {
      const { id, data } = await createPL(client, storeA.id);
      await prisma.priceList.update({
        where: { id },
        data: { status: 'ARCHIVED', isActive: false },
      });

      const res = await updatePL(client, id, storeA.id, {
        status: 'DRAFT',
        name: data.name,
      });
      expect(res.status).toBe(400);
    });

    it('ACTIVE → DRAFT is rejected', async () => {
      const suffix = uniqueSuffix();
      const { id: plId } = await createPL(client, storeA.id, {
        name: `NoDraft-${suffix}`,
      });

      const { variants, uom } = await seedProductWithVariants(
        storeA.id,
        suffix
      );
      await seedPriceRow(plId, variants[0].id, uom.id, 75);

      await updatePL(client, plId, storeA.id, {
        status: 'ACTIVE',
        name: `NoDraft-${suffix}`,
      });

      const res = await updatePL(client, plId, storeA.id, {
        status: 'DRAFT',
        name: `NoDraft-${suffix}`,
      });
      expect(res.status).toBe(400);
    });
  });

  // ─── S8: Activation gate ────────────────────────────────────────

  describe('Activation gate (S8)', () => {
    it('rejects activation when no price rows', async () => {
      const { id, data } = await createPL(client, storeA.id);

      const res = await updatePL(client, id, storeA.id, {
        status: 'ACTIVE',
        name: data.name,
      });
      expect(res.status).toBe(400);
      expect(res.data.message).toContain('no_price_rows');
    });

    it('rejects activation when FIXED row has null price', async () => {
      const suffix = uniqueSuffix();
      const { id: plId } = await createPL(client, storeA.id, {
        name: `NullPrice-${suffix}`,
      });

      const { variants, uom } = await seedProductWithVariants(
        storeA.id,
        suffix
      );
      await seedPriceRow(plId, variants[0].id, uom.id, null);

      const res = await updatePL(client, plId, storeA.id, {
        status: 'ACTIVE',
        name: `NullPrice-${suffix}`,
      });
      expect(res.status).toBe(400);
      expect(res.data.message).toContain('fixed_rows_missing_price');
    });

    it('rejects activation of SALE type with no assignments', async () => {
      const suffix = uniqueSuffix();
      const { id: plId } = await createPL(client, storeA.id, {
        type: 'SALE',
        name: `NoAssign-${suffix}`,
      });

      const { variants, uom } = await seedProductWithVariants(
        storeA.id,
        suffix
      );
      await seedPriceRow(plId, variants[0].id, uom.id);

      const res = await updatePL(client, plId, storeA.id, {
        type: 'SALE',
        status: 'ACTIVE',
        name: `NoAssign-${suffix}`,
      });
      expect(res.status).toBe(400);
      expect(res.data.message).toContain('no_assignments');
    });

    it('succeeds when all prerequisites are met', async () => {
      const suffix = uniqueSuffix();
      const { id: plId } = await createPL(client, storeA.id, {
        name: `FullActivate-${suffix}`,
      });

      const { variants, uom } = await seedProductWithVariants(
        storeA.id,
        suffix
      );
      await seedPriceRow(plId, variants[0].id, uom.id, 200);

      const res = await updatePL(client, plId, storeA.id, {
        status: 'ACTIVE',
        name: `FullActivate-${suffix}`,
      });
      expect(res.status).toBe(200);
      expect(res.data.status).toBe('ACTIVE');
    });
  });

  // ─── S9/S10/S11: Normalizations ────────────────────────────────

  describe('Normalizations (S9/S10/S11)', () => {
    it('normalizes isActive to false when status is DRAFT', async () => {
      const { data } = await createPL(client, storeA.id, {
        isActive: true,
        status: 'DRAFT',
      });
      // Backend normalizes isActive to false for non-ACTIVE statuses
      expect(data.isActive).toBe(false);
    });

    it('BASE type clears parentPriceListId and adjustment fields', async () => {
      const parent = await createPL(client, storeA.id);

      // Create as SALE with parent
      const { id: saleId, data: saleData } = await createPL(client, storeA.id, {
        type: 'SALE',
        parentPriceListId: parent.id,
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: 10,
      });

      // Switch to BASE — should clear parent + adjustment
      const res = await updatePL(client, saleId, storeA.id, {
        type: 'BASE',
        name: saleData.name,
        parentPriceListId: parent.id,
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: 10,
      });
      expect(res.status).toBe(200);
      expect(res.data.parentPriceListId).toBeNull();
      expect(res.data.adjustmentType).toBeNull();
      expect(res.data.adjustmentValue).toBeNull();
    });

    it('clears sourceCurrencyCode when isExchangeRateDerived is false', async () => {
      const { data } = await createPL(client, storeA.id, {
        isExchangeRateDerived: false,
        sourceCurrencyCode: 'USD',
      });
      // Backend clears sourceCurrencyCode when not exchange-rate-derived
      expect(data.sourceCurrencyCode).toBeNull();
      expect(data.roundingRule).toBe('NONE');
    });
  });

  // ─── Zod validation ─────────────────────────────────────────────

  describe('Zod validation', () => {
    it('rejects empty name', async () => {
      const res = await client.post(
        `${API}/save`,
        buildPayload(storeA.id, { name: '' })
      );
      expect(res.status).toBe(422);
    });

    it('rejects validFrom >= validTo', async () => {
      const res = await client.post(
        `${API}/save`,
        buildPayload(storeA.id, {
          validFrom: '2026-12-31T00:00:00.000Z',
          validTo: '2026-01-01T00:00:00.000Z',
        })
      );
      expect(res.status).toBe(422);
    });

    it('rejects isExchangeRateDerived=true without sourceCurrencyCode', async () => {
      const res = await client.post(
        `${API}/save`,
        buildPayload(storeA.id, {
          isExchangeRateDerived: true,
          sourceCurrencyCode: null,
        })
      );
      expect(res.status).toBe(422);
    });

    it('rejects sourceCurrencyCode same as defaultCurrencyCode', async () => {
      const res = await client.post(
        `${API}/save`,
        buildPayload(storeA.id, {
          isExchangeRateDerived: true,
          sourceCurrencyCode: 'TRY',
          defaultCurrencyCode: 'TRY',
        })
      );
      expect(res.status).toBe(422);
    });
  });
});
