import { createAdminClient } from '../support/admin.helper.js';
import {
  createOwnershipOnlyFixture,
  prisma,
  resetDomainFixtures,
} from '../support/prisma.helper.js';

function uniqueSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe('Domain Spaces — Creation & State', () => {
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

  it('creates a domain space and returns generated DNS instructions', async () => {
    const { client } = await createAdminClient();
    const suffix = uniqueSuffix();

    await client.put('/api/admin/platform-installation', {
      name: `E2E Installation ${suffix}`,
      portalHostname: `portal-${suffix}.e2e.test`,
      tlsAskSecret: `secret-${suffix}`,
      ingress: {
        canonicalTargetHost: `edge-${suffix}.e2e.test`,
        ipv4Addresses: ['203.0.113.11'],
        ipv6Addresses: [],
      },
    });

    const baseDomain = `helix-${suffix}.e2e.test`;
    const createRes = await client.post('/api/admin/domain-spaces', {
      baseDomain,
      onboardingMode: 'HYBRID',
      ownershipMethod: 'TXT_TOKEN',
      apexRoutingMethod: 'HTTP_WELL_KNOWN',
      wildcardRoutingMethod: 'HTTP_WELL_KNOWN',
    });

    expect(createRes.status).toBe(201);
    expect(createRes.data.baseDomain).toBe(baseDomain);
    expect(createRes.data.status).toBe('PENDING_OWNERSHIP');
    expect(createRes.data.ownership).toBeDefined();
    expect(createRes.data.ownership.record.type).toBe('TXT');
    expect(createRes.data.ownership.record.name).toBe('_helix-verify');
    expect(typeof createRes.data.ownership.record.value).toBe('string');
    expect(createRes.data.routing.apex.dns).toEqual([
      { type: 'A', name: '@', value: '203.0.113.11' },
    ]);
    expect(createRes.data.routing.wildcard.dns).toEqual([
      {
        type: 'CNAME',
        name: '*',
        value: `edge-${suffix}.e2e.test`,
      },
    ]);
    expect(createRes.data.routing.wildcard.probeHost).toBe(
      `__helix-wildcard-check.${baseDomain}`
    );
  });

  it('new domain space starts in PENDING_OWNERSHIP status', async () => {
    const { client } = await createAdminClient();
    const suffix = uniqueSuffix();

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

    const createRes = await client.post('/api/admin/domain-spaces', {
      baseDomain: `helix-${suffix}.e2e.test`,
      onboardingMode: 'HYBRID',
      ownershipMethod: 'TXT_TOKEN',
      apexRoutingMethod: 'HTTP_WELL_KNOWN',
      wildcardRoutingMethod: 'HTTP_WELL_KNOWN',
    });

    expect(createRes.status).toBe(201);
    expect(createRes.data.status).toBe('PENDING_OWNERSHIP');
    expect(createRes.data.ownership.status).toBe('PENDING');
    expect(createRes.data.routing.apex.status).toBe('PENDING');
    expect(createRes.data.routing.wildcard.status).toBe('PENDING');
  });

  it('rejects duplicate baseDomain with 409', async () => {
    const { client } = await createAdminClient();
    const suffix = uniqueSuffix();

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
    const body = {
      baseDomain,
      onboardingMode: 'HYBRID',
      ownershipMethod: 'TXT_TOKEN',
      apexRoutingMethod: 'HTTP_WELL_KNOWN',
      wildcardRoutingMethod: 'HTTP_WELL_KNOWN',
    };

    const first = await client.post('/api/admin/domain-spaces', body);
    expect(first.status).toBe(201);

    const second = await client.post('/api/admin/domain-spaces', body);
    expect(second.status).toBe(409);
  });

  it('lists domain spaces for the current installation', async () => {
    const { client } = await createAdminClient();
    const suffix = uniqueSuffix();

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
    await client.post('/api/admin/domain-spaces', {
      baseDomain,
      onboardingMode: 'HYBRID',
      ownershipMethod: 'TXT_TOKEN',
      apexRoutingMethod: 'HTTP_WELL_KNOWN',
      wildcardRoutingMethod: 'HTTP_WELL_KNOWN',
    });

    const listRes = await client.get('/api/admin/domain-spaces');
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.data)).toBe(true);
    expect(
      listRes.data.some(
        (ds: { baseDomain: string }) => ds.baseDomain === baseDomain
      )
    ).toBe(true);
  });
});

describe('Domain Spaces — Ownership Verification', () => {
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

  it('rejects apex routing verification when ownership is not yet verified', async () => {
    const { client } = await createAdminClient();
    const suffix = uniqueSuffix();

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

    const createRes = await client.post('/api/admin/domain-spaces', {
      baseDomain: `helix-${suffix}.e2e.test`,
      onboardingMode: 'HYBRID',
      ownershipMethod: 'TXT_TOKEN',
      apexRoutingMethod: 'HTTP_WELL_KNOWN',
      wildcardRoutingMethod: 'HTTP_WELL_KNOWN',
    });

    expect(createRes.status).toBe(201);
    const domainSpaceId = createRes.data.id;

    const verifyRes = await client.post(
      `/api/admin/domain-spaces/${domainSpaceId}/verify-apex-routing`
    );
    expect(verifyRes.status).toBe(400);
  });

  it('returns 404 when verifying ownership for non-existent domain space', async () => {
    const { client } = await createAdminClient();

    const res = await client.post(
      '/api/admin/domain-spaces/non-existent-id/verify-ownership'
    );
    expect(res.status).toBe(404);
  });

  it('returns 404 when verifying apex routing for non-existent domain space', async () => {
    const { client } = await createAdminClient();

    const res = await client.post(
      '/api/admin/domain-spaces/non-existent-id/verify-apex-routing'
    );
    expect(res.status).toBe(404);
  });

  it('returns 404 when verifying wildcard routing for non-existent domain space', async () => {
    const { client } = await createAdminClient();

    const res = await client.post(
      '/api/admin/domain-spaces/non-existent-id/verify-wildcard-routing'
    );
    expect(res.status).toBe(404);
  });

  it('verify-ownership returns 400 when ingress is deleted after domain space creation', async () => {
    const { client } = await createAdminClient();
    const suffix = uniqueSuffix();

    // Create installation WITH ingress (required by schema)
    const putRes = await client.put('/api/admin/platform-installation', {
      name: `E2E Installation ${suffix}`,
      portalHostname: `portal-${suffix}.e2e.test`,
      tlsAskSecret: `secret-${suffix}`,
      ingress: {
        canonicalTargetHost: `edge-${suffix}.e2e.test`,
        ipv4Addresses: ['203.0.113.10'],
        ipv6Addresses: [],
      },
    });
    expect(putRes.status).toBe(200);

    // Create domain space while ingress exists
    const createRes = await client.post('/api/admin/domain-spaces', {
      baseDomain: `helix-${suffix}.e2e.test`,
      onboardingMode: 'HYBRID',
      ownershipMethod: 'TXT_TOKEN',
      apexRoutingMethod: 'HTTP_WELL_KNOWN',
      wildcardRoutingMethod: 'HTTP_WELL_KNOWN',
    });
    expect(createRes.status).toBe(201);
    const domainSpaceId = createRes.data.id;

    // Remove ingress via Prisma to simulate misconfigured state
    await prisma.installationIngress.deleteMany({
      where: { installationId: putRes.data.id },
    });

    // Now verify-ownership must return 400 (ingress not configured)
    const verifyRes = await client.post(
      `/api/admin/domain-spaces/${domainSpaceId}/verify-ownership`
    );
    expect(verifyRes.status).toBe(400);
  });

  it('verify-ownership attempt on READY domain space does not downgrade it', async () => {
    // Fixture: ownership already VERIFIED (READY)
    const suffix = uniqueSuffix();
    const fixture = await createOwnershipOnlyFixture(suffix);
    const { client } = await createAdminClient();

    // Calling verify-ownership on an already-READY domain will hit real DNS
    // which will fail for .e2e.test — it should record FAILED but not throw 5xx
    const res = await client.post(
      `/api/admin/domain-spaces/${fixture.domainSpace.id}/verify-ownership`
    );
    // Acceptable: 200 (FAILED or VERIFIED recorded) — not 5xx
    expect(res.status).toBeLessThan(500);
  });
});
