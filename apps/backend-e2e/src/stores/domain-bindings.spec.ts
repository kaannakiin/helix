import { DomainOnboardingMode, HostBindingStatus } from '@org/prisma/client';
import { createAdminClient } from '../support/admin.helper.js';
import {
  createActiveStoreFixture,
  createApexOnlyFixture,
  createOwnershipOnlyFixture,
  createStoreOnly,
  createWildcardFixture,
  prisma,
  resetDomainFixtures,
} from '../support/prisma.helper.js';

function uniqueSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Scenario 2: Apex B2C
// ---------------------------------------------------------------------------
describe('Scenario 2 — Apex B2C binding', () => {
  beforeAll(async () => {
    await prisma.$connect();
    await resetDomainFixtures();
  });

  beforeEach(async () => {
    await resetDomainFixtures();
  });

  afterAll(async () => {
    await resetDomainFixtures();
    await prisma.$disconnect();
  });

  it('apex binding auto-activates when apex routing is already verified', async () => {
    const { client } = await createAdminClient();
    const suffix = uniqueSuffix();
    // Fixture: apex routing VERIFIED
    const fixture = await createApexOnlyFixture(suffix);

    const createRes = await client.post('/api/admin/store-host-bindings', {
      storeId: fixture.store.id,
      domainSpaceId: fixture.domainSpace.id,
      hostname: fixture.baseDomain, // apex host
      type: 'PRIMARY',
    });

    expect(createRes.status).toBe(201);
    expect(createRes.data.status).toBe(HostBindingStatus.ACTIVE);
    expect(createRes.data.activatedAt).toBeDefined();
    expect(createRes.data.activationSource).toBe('DOMAIN_APEX');
  });

  it('rejects duplicate hostname binding with 409', async () => {
    const { client } = await createAdminClient();
    const suffix = uniqueSuffix();
    const fixture = await createApexOnlyFixture(suffix);

    const body = {
      storeId: fixture.store.id,
      domainSpaceId: fixture.domainSpace.id,
      hostname: fixture.baseDomain,
      type: 'PRIMARY',
    };

    const first = await client.post('/api/admin/store-host-bindings', body);
    expect(first.status).toBe(201);

    const second = await client.post('/api/admin/store-host-bindings', body);
    expect(second.status).toBe(409);
  });

  it('rejects verify-routing for an apex hostname (must use domain space endpoint)', async () => {
    const { client } = await createAdminClient();
    const suffix = uniqueSuffix();
    const fixture = await createApexOnlyFixture(suffix);

    // Apex binding auto-activates (routingStatus=VERIFIED on creation)
    const createRes = await client.post('/api/admin/store-host-bindings', {
      storeId: fixture.store.id,
      domainSpaceId: fixture.domainSpace.id,
      hostname: fixture.baseDomain,
      type: 'PRIMARY',
    });
    expect(createRes.status).toBe(201);
    expect(createRes.data.status).toBe(HostBindingStatus.ACTIVE);

    // verify-routing on apex binding must always return 400
    const verifyRes = await client.post(
      `/api/admin/store-host-bindings/${createRes.data.id}/verify-routing`
    );
    expect(verifyRes.status).toBe(400);
  });

  it('returns 404 when verifying routing for non-existent binding', async () => {
    const { client } = await createAdminClient();

    const res = await client.post(
      '/api/admin/store-host-bindings/non-existent-id/verify-routing'
    );
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Scenario 3: Apex B2C + Exact B2B subdomain
// ---------------------------------------------------------------------------
describe('Scenario 3 — Apex B2C + Exact B2B subdomain', () => {
  beforeAll(async () => {
    await prisma.$connect();
    await resetDomainFixtures();
  });

  beforeEach(async () => {
    await resetDomainFixtures();
  });

  afterAll(async () => {
    await resetDomainFixtures();
    await prisma.$disconnect();
  });

  it('subdomain binding starts PENDING_ROUTING when only apex is verified (no wildcard)', async () => {
    const { client } = await createAdminClient();
    const suffix = uniqueSuffix();
    // Fixture: apex verified, wildcard PENDING
    const fixture = await createApexOnlyFixture(suffix);

    const subHost = `b2b.${fixture.baseDomain}`;
    const createRes = await client.post('/api/admin/store-host-bindings', {
      storeId: fixture.store.id,
      domainSpaceId: fixture.domainSpace.id,
      hostname: subHost,
      type: 'PRIMARY',
    });

    expect(createRes.status).toBe(201);
    expect(createRes.data.status).toBe(HostBindingStatus.PENDING_ROUTING);
    // challengeToken is exposed via routing.http (HTTP_WELL_KNOWN descriptor)
    expect(createRes.data.routing.http).toBeDefined();
    expect(createRes.data.routing.http.expectedBody).toBeDefined();
  });

  it('verify-routing on pending subdomain attempts HTTP challenge and returns result', async () => {
    const { client } = await createAdminClient();
    const suffix = uniqueSuffix();
    const fixture = await createApexOnlyFixture(suffix);

    const subHost = `b2b.${fixture.baseDomain}`;
    const createRes = await client.post('/api/admin/store-host-bindings', {
      storeId: fixture.store.id,
      domainSpaceId: fixture.domainSpace.id,
      hostname: subHost,
      type: 'PRIMARY',
    });
    expect(createRes.status).toBe(201);
    const bindingId = createRes.data.id;

    // Real HTTP challenge will fail for .e2e.test — expect 200 with FAILED status (not 5xx)
    const verifyRes = await client.post(
      `/api/admin/store-host-bindings/${bindingId}/verify-routing`
    );
    expect(verifyRes.status).toBe(200);
    // routingStatus should be FAILED since .e2e.test won't respond
    expect(verifyRes.data.routing).toBeDefined();
  });

  it('lists bindings filtered by storeId', async () => {
    const { client } = await createAdminClient();
    const suffix = uniqueSuffix();
    const fixture = await createActiveStoreFixture(suffix);

    const listRes = await client.get('/api/admin/store-host-bindings', {
      params: { storeId: fixture.store.id },
    });

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.data)).toBe(true);
    expect(
      listRes.data.every(
        (b: { store: { id: string } }) => b.store.id === fixture.store.id
      )
    ).toBe(true);
  });

  it('binding creation fails when hostname is outside the domain space', async () => {
    const { client } = await createAdminClient();
    const suffix = uniqueSuffix();
    const fixture = await createApexOnlyFixture(suffix);

    const foreignHost = `totally-different-domain.e2e.test`;
    const createRes = await client.post('/api/admin/store-host-bindings', {
      storeId: fixture.store.id,
      domainSpaceId: fixture.domainSpace.id,
      hostname: foreignHost,
      type: 'PRIMARY',
    });

    expect(createRes.status).toBe(409);
  });

  it('binding creation fails when domain space ownership is not verified', async () => {
    const { client } = await createAdminClient();
    const suffix = uniqueSuffix();

    // Create installation + domain space via API (PENDING_OWNERSHIP)
    await client.put('/api/admin/platform-installation', {
      name: `E2E Installation ${suffix}`,
      portalHostname: `portal-${suffix}.e2e.test`,
      tlsAskSecret: `secret-${suffix}`,
      ingress: {
        canonicalTargetHost: `edge-${suffix}.e2e.test`,
        ipv4Addresses: ['203.0.113.10'],
        ipv6Addresses: [],
      },
    });

    const baseDomain = `helix-${suffix}.e2e.test`;
    const dsRes = await client.post('/api/admin/domain-spaces', {
      baseDomain,
      onboardingMode: 'HYBRID',
      ownershipMethod: 'TXT_TOKEN',
      apexRoutingMethod: 'HTTP_WELL_KNOWN',
      wildcardRoutingMethod: 'HTTP_WELL_KNOWN',
    });
    expect(dsRes.status).toBe(201);

    // Create a store via Prisma fixture (no admin store API yet)
    const store = await createStoreOnly(suffix);

    const createRes = await client.post('/api/admin/store-host-bindings', {
      storeId: store.id,
      domainSpaceId: dsRes.data.id,
      hostname: baseDomain,
      type: 'PRIMARY',
    });

    expect(createRes.status).toBe(400);
  });

  it('binding for portalHostname is rejected', async () => {
    const { client } = await createAdminClient();
    const suffix = uniqueSuffix();
    const fixture = await createApexOnlyFixture(suffix);

    const createRes = await client.post('/api/admin/store-host-bindings', {
      storeId: fixture.store.id,
      domainSpaceId: fixture.domainSpace.id,
      hostname: fixture.portalHostname,
      type: 'PRIMARY',
    });

    // 409 (host reserved) or 409 (outside domain space)
    expect(createRes.status).toBeGreaterThanOrEqual(400);
    expect(createRes.status).toBeLessThan(500);
  });
});

// ---------------------------------------------------------------------------
// Scenario 4: Wildcard Family
// ---------------------------------------------------------------------------
describe('Scenario 4 — Wildcard family auto-activation', () => {
  beforeAll(async () => {
    await prisma.$connect();
    await resetDomainFixtures();
  });

  beforeEach(async () => {
    await resetDomainFixtures();
  });

  afterAll(async () => {
    await resetDomainFixtures();
    await prisma.$disconnect();
  });

  it('subdomain binding auto-activates when wildcard routing is verified (HYBRID mode)', async () => {
    const { client } = await createAdminClient();
    const suffix = uniqueSuffix();
    // Fixture: wildcard VERIFIED, HYBRID mode
    const fixture = await createWildcardFixture(suffix, DomainOnboardingMode.HYBRID);

    const subHost = `shop.${fixture.baseDomain}`;
    const createRes = await client.post('/api/admin/store-host-bindings', {
      storeId: fixture.store.id,
      domainSpaceId: fixture.domainSpace.id,
      hostname: subHost,
      type: 'PRIMARY',
    });

    expect(createRes.status).toBe(201);
    expect(createRes.data.status).toBe(HostBindingStatus.ACTIVE);
    expect(createRes.data.activationSource).toBe('DOMAIN_WILDCARD');
  });

  it('subdomain binding stays PENDING_ROUTING in EXACT_HOSTS mode even with wildcard verified', async () => {
    const { client } = await createAdminClient();
    const suffix = uniqueSuffix();
    // Fixture: wildcard VERIFIED, but EXACT_HOSTS mode — wildcard should not auto-activate
    const fixture = await createWildcardFixture(suffix, DomainOnboardingMode.EXACT_HOSTS);

    const subHost = `shop.${fixture.baseDomain}`;
    const createRes = await client.post('/api/admin/store-host-bindings', {
      storeId: fixture.store.id,
      domainSpaceId: fixture.domainSpace.id,
      hostname: subHost,
      type: 'PRIMARY',
    });

    expect(createRes.status).toBe(201);
    expect(createRes.data.status).toBe(HostBindingStatus.PENDING_ROUTING);
  });

  it('multiple subdomain bindings all auto-activate under wildcard-verified HYBRID domain', async () => {
    const { client } = await createAdminClient();
    const suffix = uniqueSuffix();
    const fixture = await createWildcardFixture(suffix, DomainOnboardingMode.HYBRID);

    const hosts = [
      `shop.${fixture.baseDomain}`,
      `b2b.${fixture.baseDomain}`,
    ];

    for (const hostname of hosts) {
      const res = await client.post('/api/admin/store-host-bindings', {
        storeId: fixture.store.id,
        domainSpaceId: fixture.domainSpace.id,
        hostname,
        type: 'ALIAS',
      });
      expect(res.status).toBe(201);
      expect(res.data.status).toBe(HostBindingStatus.ACTIVE);
    }
  });

  it('READY domain space without routing verification produces PENDING_ROUTING binding', async () => {
    const { client } = await createAdminClient();
    const suffix = uniqueSuffix();
    // Fixture: ownership ONLY verified (apex + wildcard PENDING)
    const fixture = await createOwnershipOnlyFixture(suffix);

    const subHost = `shop.${fixture.baseDomain}`;
    const createRes = await client.post('/api/admin/store-host-bindings', {
      storeId: fixture.store.id,
      domainSpaceId: fixture.domainSpace.id,
      hostname: subHost,
      type: 'PRIMARY',
    });

    expect(createRes.status).toBe(201);
    expect(createRes.data.status).toBe(HostBindingStatus.PENDING_ROUTING);
  });
});
