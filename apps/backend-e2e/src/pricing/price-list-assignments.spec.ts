import type { AxiosInstance } from 'axios';
import { createAdminClient } from '../support/admin.helper.js';
import {
  prisma,
  resetPricingFixtures,
  createPricingStore,
  createCustomerGroupFixture,
  createOrganizationFixture,
  createCustomerFixture,
  uniqueSuffix,
} from '../support/prisma.helper.js';

function assignmentsApi(priceListId: string) {
  return `/api/admin/price-lists/${priceListId}/assignments`;
}

function buildPriceListPayload(
  storeId: string,
  overrides: Record<string, unknown> = {}
) {
  return {
    name: `AssignPL-${uniqueSuffix()}`,
    storeId,
    type: 'SALE',
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
    ...overrides,
  };
}

describe('Pricing — Price List Assignments', () => {
  let client: AxiosInstance;

  // Store A fixtures
  let storeAId: string;
  let priceListAId: string;
  let groupA: { id: string };
  let orgA: { id: string };
  let customerA: { id: string };

  // Store B fixtures (for cross-store tests)
  let storeBId: string;
  let groupB: { id: string };

  beforeAll(async () => {
    await prisma.$connect();
    await resetPricingFixtures();

    const admin = await createAdminClient();
    client = admin.client;

    // Setup Store A
    const suffixA = uniqueSuffix();
    const fixtureA = await createPricingStore(suffixA);
    storeAId = fixtureA.store.id;

    groupA = await createCustomerGroupFixture(storeAId, suffixA);
    orgA = await createOrganizationFixture(storeAId, suffixA);
    customerA = await createCustomerFixture(storeAId, suffixA);

    const plResA = await client.post(
      '/api/admin/price-lists/save',
      buildPriceListPayload(storeAId)
    );
    priceListAId = plResA.data.id;

    // Setup Store B
    const suffixB = uniqueSuffix();
    const fixtureB = await createPricingStore(suffixB);
    storeBId = fixtureB.store.id;
    groupB = await createCustomerGroupFixture(storeBId, suffixB);
  });

  afterAll(async () => {
    await resetPricingFixtures();
    await prisma.$disconnect();
  });

  // ─── CRUD ────────────────────────────────────────────────────────

  describe('Assignment CRUD', () => {
    it('creates a CUSTOMER_GROUP assignment', async () => {
      const res = await client.post(assignmentsApi(priceListAId), {
        targetType: 'CUSTOMER_GROUP',
        customerGroupId: groupA.id,
        organizationId: null,
        customerId: null,
        priority: 1,
      });

      expect(res.status).toBe(201);
      expect(res.data.id).toBeDefined();
      expect(res.data.targetType).toBe('CUSTOMER_GROUP');
      expect(res.data.customerGroupId).toBe(groupA.id);
      expect(res.data.customerGroup).toBeDefined();
    });

    it('creates an ORGANIZATION assignment', async () => {
      const res = await client.post(assignmentsApi(priceListAId), {
        targetType: 'ORGANIZATION',
        customerGroupId: null,
        organizationId: orgA.id,
        customerId: null,
        priority: 2,
      });

      expect(res.status).toBe(201);
      expect(res.data.targetType).toBe('ORGANIZATION');
      expect(res.data.organizationId).toBe(orgA.id);
    });

    it('creates a CUSTOMER assignment', async () => {
      const res = await client.post(assignmentsApi(priceListAId), {
        targetType: 'CUSTOMER',
        customerGroupId: null,
        organizationId: null,
        customerId: customerA.id,
        priority: 3,
      });

      expect(res.status).toBe(201);
      expect(res.data.targetType).toBe('CUSTOMER');
      expect(res.data.customerId).toBe(customerA.id);
    });

    it('creates an ALL_CUSTOMERS assignment', async () => {
      const res = await client.post(assignmentsApi(priceListAId), {
        targetType: 'ALL_CUSTOMERS',
        customerGroupId: null,
        organizationId: null,
        customerId: null,
        priority: 0,
      });

      expect(res.status).toBe(201);
      expect(res.data.targetType).toBe('ALL_CUSTOMERS');
    });

    it('lists assignments ordered by priority', async () => {
      const res = await client.get(assignmentsApi(priceListAId));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBeGreaterThanOrEqual(4);

      // Verify ordering by priority ASC
      for (let i = 1; i < res.data.length; i++) {
        expect(res.data[i].priority).toBeGreaterThanOrEqual(
          res.data[i - 1].priority
        );
      }
    });

    it('updates assignment priority', async () => {
      const listRes = await client.get(assignmentsApi(priceListAId));
      const assignmentId = listRes.data[0].id;

      const res = await client.patch(
        `${assignmentsApi(priceListAId)}/${assignmentId}`,
        { priority: 99 }
      );

      expect(res.status).toBe(200);
      expect(res.data.priority).toBe(99);
    });

    it('deletes an assignment', async () => {
      // Create a throwaway assignment to delete
      const plRes = await client.post(
        '/api/admin/price-lists/save',
        buildPriceListPayload(storeAId)
      );
      const tempPlId = plRes.data.id;

      const created = await client.post(assignmentsApi(tempPlId), {
        targetType: 'ALL_CUSTOMERS',
        customerGroupId: null,
        organizationId: null,
        customerId: null,
        priority: 0,
      });

      const res = await client.delete(
        `${assignmentsApi(tempPlId)}/${created.data.id}`
      );
      expect(res.status).toBe(204);
    });

    it('returns 404 when deleting non-existent assignment', async () => {
      const res = await client.delete(
        `${assignmentsApi(priceListAId)}/clxxxxxxxxxxxxxxxxxxxxxxxxx`
      );
      expect(res.status).toBe(404);
    });
  });

  // ─── S17: Cross-store scope ─────────────────────────────────────

  describe('Cross-store scope validation (S17)', () => {
    it('rejects customerGroup from different store', async () => {
      const res = await client.post(assignmentsApi(priceListAId), {
        targetType: 'CUSTOMER_GROUP',
        customerGroupId: groupB.id,
        organizationId: null,
        customerId: null,
        priority: 0,
      });
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent customerGroupId', async () => {
      const res = await client.post(assignmentsApi(priceListAId), {
        targetType: 'CUSTOMER_GROUP',
        customerGroupId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        organizationId: null,
        customerId: null,
        priority: 0,
      });
      expect(res.status).toBe(404);
    });

    it('returns 404 for non-existent organizationId', async () => {
      const res = await client.post(assignmentsApi(priceListAId), {
        targetType: 'ORGANIZATION',
        customerGroupId: null,
        organizationId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        customerId: null,
        priority: 0,
      });
      expect(res.status).toBe(404);
    });

    it('returns 404 for non-existent customerId', async () => {
      const res = await client.post(assignmentsApi(priceListAId), {
        targetType: 'CUSTOMER',
        customerGroupId: null,
        organizationId: null,
        customerId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        priority: 0,
      });
      expect(res.status).toBe(404);
    });

    it('returns 404 for non-existent priceListId', async () => {
      const res = await client.post(
        assignmentsApi('clxxxxxxxxxxxxxxxxxxxxxxxxx'),
        {
          targetType: 'ALL_CUSTOMERS',
          customerGroupId: null,
          organizationId: null,
          customerId: null,
          priority: 0,
        }
      );
      expect(res.status).toBe(404);
    });
  });

  // ─── S18: Duplicate detection ───────────────────────────────────

  describe('Duplicate assignment detection (S18)', () => {
    it('rejects duplicate assignment (same targetType + FK)', async () => {
      // groupA assignment was already created in CRUD tests
      const res = await client.post(assignmentsApi(priceListAId), {
        targetType: 'CUSTOMER_GROUP',
        customerGroupId: groupA.id,
        organizationId: null,
        customerId: null,
        priority: 5,
      });
      expect(res.status).toBe(409);
    });

    it('allows same customerGroup on different price list', async () => {
      const plRes = await client.post(
        '/api/admin/price-lists/save',
        buildPriceListPayload(storeAId)
      );
      const newPlId = plRes.data.id;

      const res = await client.post(assignmentsApi(newPlId), {
        targetType: 'CUSTOMER_GROUP',
        customerGroupId: groupA.id,
        organizationId: null,
        customerId: null,
        priority: 0,
      });
      expect(res.status).toBe(201);
    });
  });

  // ─── S19: targetType exclusivity (Zod) ──────────────────────────

  describe('targetType exclusivity (Zod validation)', () => {
    let zodPlId: string;

    beforeAll(async () => {
      const plRes = await client.post(
        '/api/admin/price-lists/save',
        buildPriceListPayload(storeAId)
      );
      zodPlId = plRes.data.id;
    });

    it('ALL_CUSTOMERS rejects non-null customerGroupId', async () => {
      const res = await client.post(assignmentsApi(zodPlId), {
        targetType: 'ALL_CUSTOMERS',
        customerGroupId: groupA.id,
        organizationId: null,
        customerId: null,
        priority: 0,
      });
      expect(res.status).toBe(400);
    });

    it('CUSTOMER_GROUP requires customerGroupId', async () => {
      const res = await client.post(assignmentsApi(zodPlId), {
        targetType: 'CUSTOMER_GROUP',
        customerGroupId: null,
        organizationId: null,
        customerId: null,
        priority: 0,
      });
      expect(res.status).toBe(400);
    });

    it('CUSTOMER_GROUP rejects non-null organizationId', async () => {
      const res = await client.post(assignmentsApi(zodPlId), {
        targetType: 'CUSTOMER_GROUP',
        customerGroupId: groupA.id,
        organizationId: orgA.id,
        customerId: null,
        priority: 0,
      });
      expect(res.status).toBe(400);
    });

    it('ORGANIZATION requires organizationId', async () => {
      const res = await client.post(assignmentsApi(zodPlId), {
        targetType: 'ORGANIZATION',
        customerGroupId: null,
        organizationId: null,
        customerId: null,
        priority: 0,
      });
      expect(res.status).toBe(400);
    });

    it('CUSTOMER requires customerId', async () => {
      const res = await client.post(assignmentsApi(zodPlId), {
        targetType: 'CUSTOMER',
        customerGroupId: null,
        organizationId: null,
        customerId: null,
        priority: 0,
      });
      expect(res.status).toBe(400);
    });
  });
});
