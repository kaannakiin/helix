import {
  createAuthClient,
  createStorefrontClient,
  registerAndGetCredentials,
  registerCustomer,
} from '../support/auth.helper.js';
import {
  createActiveStoreFixture,
  prisma,
  resetDomainFixtures,
} from '../support/prisma.helper.js';

function uniqueSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe('Storefront Auth Separation', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await resetDomainFixtures();
  });

  afterAll(async () => {
    await resetDomainFixtures();
    await prisma.$disconnect();
  });

  it('returns the current customer profile on the matching storefront host', async () => {
    const fixture = await createActiveStoreFixture(uniqueSuffix());
    const customerClient = createStorefrontClient(fixture.host);
    const email = `customer-${uniqueSuffix()}@e2e.test`;

    const registerRes = await registerCustomer(customerClient, { email });

    expect(registerRes.status).toBe(201);

    const meRes = await customerClient.get('/api/storefront/auth/me');

    expect(meRes.status).toBe(200);
    expect(meRes.data.email).toBe(email);
    expect(meRes.data.storeId).toBe(fixture.store.id);
  });

  it('rejects portal cookies on storefront protected routes', async () => {
    const fixture = await createActiveStoreFixture(uniqueSuffix());
    const portalClient = createAuthClient();
    const { email, password } = await registerAndGetCredentials(portalClient);

    await portalClient.post('/api/auth/login', { email, password });

    const meRes = await portalClient.get('/api/storefront/auth/me', {
      headers: { Host: fixture.host },
    });

    expect(meRes.status).toBe(401);
  });

  it('rejects customer cookies on portal protected routes', async () => {
    const fixture = await createActiveStoreFixture(uniqueSuffix());
    const customerClient = createStorefrontClient(fixture.host);

    await registerCustomer(customerClient);

    const meRes = await customerClient.get('/api/auth/me');

    expect(meRes.status).toBe(401);
  });

  it('returns 404 for portal and unknown hosts on protected storefront routes', async () => {
    const fixture = await createActiveStoreFixture(uniqueSuffix());
    const customerClient = createStorefrontClient(fixture.host);

    await registerCustomer(customerClient);

    const portalRes = await customerClient.get('/api/storefront/auth/me', {
      headers: { Host: fixture.portalHostname },
    });
    const unknownRes = await customerClient.get('/api/storefront/auth/me', {
      headers: { Host: `unknown-${uniqueSuffix()}.e2e.test` },
    });

    expect(portalRes.status).toBe(404);
    expect(unknownRes.status).toBe(404);
  });

  it('rejects me, refresh, and logout on another active store host', async () => {
    const fixtureA = await createActiveStoreFixture(uniqueSuffix());
    const fixtureB = await createActiveStoreFixture(uniqueSuffix());
    const customerClient = createStorefrontClient(fixtureA.host);

    await registerCustomer(customerClient);

    const meRes = await customerClient.get('/api/storefront/auth/me', {
      headers: { Host: fixtureB.host },
    });
    const refreshRes = await customerClient.post(
      '/api/storefront/auth/refresh',
      null,
      {
        headers: { Host: fixtureB.host },
      }
    );
    const logoutRes = await customerClient.post(
      '/api/storefront/auth/logout',
      null,
      {
        headers: { Host: fixtureB.host },
      }
    );
    const stillAuthorizedRes = await customerClient.get('/api/storefront/auth/me');

    expect(meRes.status).toBe(403);
    expect(refreshRes.status).toBe(403);
    expect(logoutRes.status).toBe(403);
    expect(stillAuthorizedRes.status).toBe(200);
  });
});
