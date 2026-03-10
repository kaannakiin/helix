import type { AxiosInstance } from 'axios';
import { createAdminClient } from '../support/admin.helper.js';
import {
  prisma,
  resetPricingFixtures,
  createPricingStore,
  createProductWithVariants,
  uniqueSuffix,
} from '../support/prisma.helper.js';

function pricesApi(priceListId: string) {
  return `/api/admin/price-lists/${priceListId}/prices`;
}

describe('Pricing — Price List Prices', () => {
  let client: AxiosInstance;
  let storeId: string;
  let priceListId: string;
  let variants: { id: string; sku: string | null }[];
  let uomId: string;

  beforeAll(async () => {
    await prisma.$connect();
    await resetPricingFixtures();

    const admin = await createAdminClient();
    client = admin.client;

    const suffix = uniqueSuffix();
    const { store } = await createPricingStore(suffix);
    storeId = store.id;

    const productFixture = await createProductWithVariants(storeId, suffix, 5);
    variants = productFixture.variants;
    uomId = productFixture.uom.id;

    // Create a DRAFT price list via API
    const plRes = await client.post('/api/admin/price-lists/save', {
      name: `PricesPL-${suffix}`,
      storeId,
      type: 'BASE',
      status: 'DRAFT',
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
      sourceSystem: 'INTERNAL',
      isSourceLocked: false,
      isExchangeRateDerived: false,
      sourceCurrencyCode: null,
      roundingRule: 'NONE',
    });
    priceListId = plRes.data.id;
  });

  afterAll(async () => {
    await resetPricingFixtures();
    await prisma.$disconnect();
  });

  // ─── CRUD ────────────────────────────────────────────────────────

  describe('Price Row CRUD', () => {
    it('creates a FIXED price row', async () => {
      const res = await client.post(`${pricesApi(priceListId)}/save`, {
        priceListId,
        productVariantId: variants[0].id,
        originType: 'FIXED',
        price: 100,
        compareAtPrice: null,
        costPrice: null,
        adjustmentType: null,
        adjustmentValue: null,
        currencyCode: 'TRY',
        minQuantity: 1,
        maxQuantity: null,
        unitOfMeasureId: uomId,
        taxBehavior: 'INCLUSIVE',
        validFrom: null,
        validTo: null,
        conditionType: null,
      });

      expect(res.status).toBe(200);
      expect(res.data.id).toBeDefined();
      expect(res.data.originType).toBe('FIXED');
      expect(Number(res.data.price)).toBe(100);
    });

    it('creates a RELATIVE price row', async () => {
      const res = await client.post(`${pricesApi(priceListId)}/save`, {
        priceListId,
        productVariantId: variants[1].id,
        originType: 'RELATIVE',
        price: null,
        compareAtPrice: null,
        costPrice: null,
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: 10,
        currencyCode: 'TRY',
        minQuantity: 1,
        maxQuantity: null,
        unitOfMeasureId: uomId,
        taxBehavior: 'INCLUSIVE',
        validFrom: null,
        validTo: null,
        conditionType: null,
      });

      expect(res.status).toBe(200);
      expect(res.data.originType).toBe('RELATIVE');
      expect(res.data.adjustmentType).toBe('PERCENTAGE');
    });

    it('updates an existing price row', async () => {
      // Create a row first
      const created = await client.post(`${pricesApi(priceListId)}/save`, {
        priceListId,
        productVariantId: variants[2].id,
        originType: 'FIXED',
        price: 50,
        compareAtPrice: null,
        costPrice: null,
        adjustmentType: null,
        adjustmentValue: null,
        currencyCode: 'TRY',
        minQuantity: 1,
        maxQuantity: null,
        unitOfMeasureId: uomId,
        taxBehavior: 'INCLUSIVE',
        validFrom: null,
        validTo: null,
        conditionType: null,
      });

      const res = await client.post(`${pricesApi(priceListId)}/save`, {
        id: created.data.id,
        priceListId,
        productVariantId: variants[2].id,
        originType: 'FIXED',
        price: 75,
        compareAtPrice: null,
        costPrice: null,
        adjustmentType: null,
        adjustmentValue: null,
        currencyCode: 'TRY',
        minQuantity: 1,
        maxQuantity: null,
        unitOfMeasureId: uomId,
        taxBehavior: 'INCLUSIVE',
        validFrom: null,
        validTo: null,
        conditionType: null,
      });

      expect(res.status).toBe(200);
      expect(Number(res.data.price)).toBe(75);
    });

    it('deletes a price row', async () => {
      const created = await client.post(`${pricesApi(priceListId)}/save`, {
        priceListId,
        productVariantId: variants[3].id,
        originType: 'FIXED',
        price: 30,
        compareAtPrice: null,
        costPrice: null,
        adjustmentType: null,
        adjustmentValue: null,
        currencyCode: 'TRY',
        minQuantity: 1,
        maxQuantity: null,
        unitOfMeasureId: uomId,
        taxBehavior: 'INCLUSIVE',
        validFrom: null,
        validTo: null,
        conditionType: null,
      });

      const res = await client.delete(
        `${pricesApi(priceListId)}/${created.data.id}`
      );
      expect(res.status).toBe(204);
    });

    it('returns 404 for non-existent row on update', async () => {
      const res = await client.post(`${pricesApi(priceListId)}/save`, {
        id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        priceListId,
        productVariantId: variants[0].id,
        originType: 'FIXED',
        price: 10,
        compareAtPrice: null,
        costPrice: null,
        adjustmentType: null,
        adjustmentValue: null,
        currencyCode: 'TRY',
        minQuantity: 1,
        maxQuantity: null,
        unitOfMeasureId: uomId,
        taxBehavior: 'INCLUSIVE',
        validFrom: null,
        validTo: null,
        conditionType: null,
      });
      expect(res.status).toBe(404);
    });
  });

  // ─── S14: Source-locked rows ────────────────────────────────────

  describe('Source-locked rows (S14)', () => {
    let lockedRowId: string;

    beforeAll(async () => {
      const created = await client.post(`${pricesApi(priceListId)}/save`, {
        priceListId,
        productVariantId: variants[4].id,
        originType: 'FIXED',
        price: 999,
        compareAtPrice: null,
        costPrice: null,
        adjustmentType: null,
        adjustmentValue: null,
        currencyCode: 'TRY',
        minQuantity: 1,
        maxQuantity: null,
        unitOfMeasureId: uomId,
        taxBehavior: 'INCLUSIVE',
        validFrom: null,
        validTo: null,
        conditionType: null,
      });
      lockedRowId = created.data.id;
      await prisma.priceListPrice.update({
        where: { id: lockedRowId },
        data: { isSourceLocked: true },
      });
    });

    it('rejects update on source-locked row', async () => {
      const res = await client.post(`${pricesApi(priceListId)}/save`, {
        id: lockedRowId,
        priceListId,
        productVariantId: variants[4].id,
        originType: 'FIXED',
        price: 1000,
        compareAtPrice: null,
        costPrice: null,
        adjustmentType: null,
        adjustmentValue: null,
        currencyCode: 'TRY',
        minQuantity: 1,
        maxQuantity: null,
        unitOfMeasureId: uomId,
        taxBehavior: 'INCLUSIVE',
        validFrom: null,
        validTo: null,
        conditionType: null,
      });
      expect(res.status).toBe(400);
    });

    it('rejects delete on source-locked row', async () => {
      const res = await client.delete(
        `${pricesApi(priceListId)}/${lockedRowId}`
      );
      expect(res.status).toBe(400);
    });
  });

  // ─── S15: Duplicate detection ───────────────────────────────────

  describe('Duplicate detection (S15)', () => {
    it('rejects duplicate (same variant+currency+uom+minQty)', async () => {
      // variants[0] already has a TRY row from CRUD tests
      const res = await client.post(`${pricesApi(priceListId)}/save`, {
        priceListId,
        productVariantId: variants[0].id,
        originType: 'FIXED',
        price: 200,
        compareAtPrice: null,
        costPrice: null,
        adjustmentType: null,
        adjustmentValue: null,
        currencyCode: 'TRY',
        minQuantity: 1,
        maxQuantity: null,
        unitOfMeasureId: uomId,
        taxBehavior: 'INCLUSIVE',
        validFrom: null,
        validTo: null,
        conditionType: null,
      });
      expect(res.status).toBe(409);
    });

    it('allows same variant with different currency', async () => {
      const res = await client.post(`${pricesApi(priceListId)}/save`, {
        priceListId,
        productVariantId: variants[0].id,
        originType: 'FIXED',
        price: 15,
        compareAtPrice: null,
        costPrice: null,
        adjustmentType: null,
        adjustmentValue: null,
        currencyCode: 'USD',
        minQuantity: 1,
        maxQuantity: null,
        unitOfMeasureId: uomId,
        taxBehavior: 'INCLUSIVE',
        validFrom: null,
        validTo: null,
        conditionType: null,
      });
      expect(res.status).toBe(200);
    });

    it('allows same variant with different minQuantity', async () => {
      const res = await client.post(`${pricesApi(priceListId)}/save`, {
        priceListId,
        productVariantId: variants[0].id,
        originType: 'FIXED',
        price: 80,
        compareAtPrice: null,
        costPrice: null,
        adjustmentType: null,
        adjustmentValue: null,
        currencyCode: 'TRY',
        minQuantity: 10,
        maxQuantity: null,
        unitOfMeasureId: uomId,
        taxBehavior: 'INCLUSIVE',
        validFrom: null,
        validTo: null,
        conditionType: null,
      });
      expect(res.status).toBe(200);
    });
  });

  // ─── Bulk create ────────────────────────────────────────────────

  describe('Bulk create (S16)', () => {
    let bulkPriceListId: string;
    let bulkVariants: { id: string }[];
    let bulkUomId: string;

    beforeAll(async () => {
      const suffix = uniqueSuffix();
      const plRes = await client.post('/api/admin/price-lists/save', {
        name: `BulkPL-${suffix}`,
        storeId,
        type: 'BASE',
        status: 'DRAFT',
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
        sourceSystem: 'INTERNAL',
        isSourceLocked: false,
        isExchangeRateDerived: false,
        sourceCurrencyCode: null,
        roundingRule: 'NONE',
      });
      bulkPriceListId = plRes.data.id;

      const productFixture = await createProductWithVariants(storeId, suffix, 5);
      bulkVariants = productFixture.variants;
      bulkUomId = productFixture.uom.id;
    });

    it('creates rows for multiple variants', async () => {
      const res = await client.post(
        `${pricesApi(bulkPriceListId)}/bulk-create`,
        {
          priceListId: bulkPriceListId,
          variantIds: [bulkVariants[0].id, bulkVariants[1].id, bulkVariants[2].id],
          currencyCode: 'TRY',
          unitOfMeasureId: bulkUomId,
          originType: 'FIXED',
        }
      );
      expect(res.status).toBe(201);
      expect(res.data.created).toBe(3);
    });

    it('skips existing variants on repeat', async () => {
      const res = await client.post(
        `${pricesApi(bulkPriceListId)}/bulk-create`,
        {
          priceListId: bulkPriceListId,
          variantIds: [
            bulkVariants[0].id,
            bulkVariants[1].id,
            bulkVariants[3].id,
          ],
          currencyCode: 'TRY',
          unitOfMeasureId: bulkUomId,
          originType: 'FIXED',
        }
      );
      expect(res.status).toBe(201);
      expect(res.data.created).toBe(1); // only bulkVariants[3]
    });

    it('returns created: 0 when all variants exist', async () => {
      const res = await client.post(
        `${pricesApi(bulkPriceListId)}/bulk-create`,
        {
          priceListId: bulkPriceListId,
          variantIds: [bulkVariants[0].id, bulkVariants[1].id],
          currencyCode: 'TRY',
          unitOfMeasureId: bulkUomId,
          originType: 'FIXED',
        }
      );
      expect(res.status).toBe(201);
      expect(res.data.created).toBe(0);
    });
  });

  // ─── Query & Summary ───────────────────────────────────────────

  describe('Query & Summary', () => {
    it('returns paginated results', async () => {
      const res = await client.post(`${pricesApi(priceListId)}/query`, {
        page: 1,
        limit: 10,
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.pagination.total).toBeGreaterThanOrEqual(1);
    });

    it('summary returns correct stats', async () => {
      const res = await client.get(`${pricesApi(priceListId)}/summary`);
      expect(res.status).toBe(200);
      expect(res.data.totalRows).toBeGreaterThanOrEqual(1);
      expect(typeof res.data.lockedRows).toBe('number');
      expect(typeof res.data.missingPrices).toBe('number');
      expect(Array.isArray(res.data.currencies)).toBe(true);
    });
  });

  // ─── Search variants ───────────────────────────────────────────

  describe('Search variants', () => {
    it('returns variants not in price list', async () => {
      const res = await client.post(
        `${pricesApi(priceListId)}/search-variants`,
        { search: '', page: 1, limit: 20 }
      );
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.pagination).toBeDefined();
    });

    it('filters by SKU search term', async () => {
      const targetSku = variants[0].sku!;
      const res = await client.post(
        `${pricesApi(priceListId)}/search-variants`,
        { search: targetSku, page: 1, limit: 20 }
      );
      expect(res.status).toBe(200);
      // Variant 0 is already in price list, so it should NOT appear
      const foundIds = res.data.data.map((v: { id: string }) => v.id);
      expect(foundIds).not.toContain(variants[0].id);
    });
  });

  // ─── Zod validation ─────────────────────────────────────────────

  describe('Zod validation', () => {
    it('rejects RELATIVE without adjustmentType', async () => {
      const res = await client.post(`${pricesApi(priceListId)}/save`, {
        priceListId,
        productVariantId: variants[3].id,
        originType: 'RELATIVE',
        price: null,
        compareAtPrice: null,
        costPrice: null,
        adjustmentType: null,
        adjustmentValue: 10,
        currencyCode: 'TRY',
        minQuantity: 1,
        maxQuantity: null,
        unitOfMeasureId: uomId,
        taxBehavior: 'INCLUSIVE',
        validFrom: null,
        validTo: null,
        conditionType: null,
      });
      expect(res.status).toBe(400);
    });

    it('rejects compareAtPrice < price', async () => {
      const res = await client.post(`${pricesApi(priceListId)}/save`, {
        priceListId,
        productVariantId: variants[3].id,
        originType: 'FIXED',
        price: 100,
        compareAtPrice: 50,
        costPrice: null,
        adjustmentType: null,
        adjustmentValue: null,
        currencyCode: 'TRY',
        minQuantity: 1,
        maxQuantity: null,
        unitOfMeasureId: uomId,
        taxBehavior: 'INCLUSIVE',
        validFrom: null,
        validTo: null,
        conditionType: null,
      });
      expect(res.status).toBe(400);
    });

    it('rejects maxQuantity < minQuantity', async () => {
      const res = await client.post(`${pricesApi(priceListId)}/save`, {
        priceListId,
        productVariantId: variants[3].id,
        originType: 'FIXED',
        price: 50,
        compareAtPrice: null,
        costPrice: null,
        adjustmentType: null,
        adjustmentValue: null,
        currencyCode: 'TRY',
        minQuantity: 10,
        maxQuantity: 5,
        unitOfMeasureId: uomId,
        taxBehavior: 'INCLUSIVE',
        validFrom: null,
        validTo: null,
        conditionType: null,
      });
      expect(res.status).toBe(400);
    });

    it('rejects negative price', async () => {
      const res = await client.post(`${pricesApi(priceListId)}/save`, {
        priceListId,
        productVariantId: variants[3].id,
        originType: 'FIXED',
        price: -10,
        compareAtPrice: null,
        costPrice: null,
        adjustmentType: null,
        adjustmentValue: null,
        currencyCode: 'TRY',
        minQuantity: 1,
        maxQuantity: null,
        unitOfMeasureId: uomId,
        taxBehavior: 'INCLUSIVE',
        validFrom: null,
        validTo: null,
        conditionType: null,
      });
      expect(res.status).toBe(400);
    });
  });
});
