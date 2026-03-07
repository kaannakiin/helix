/**
 * Platform Installation E2E tests
 *
 * Design notes:
 * - PlatformInstallation is a singleton: findCurrent() returns the oldest record.
 * - jest.config.cts sets maxWorkers=1 so tests run sequentially — no cross-test
 *   fixture contamination from parallel workers.
 * - resetDomainFixtures() cleans all .e2e.test records before each test.
 * - ingress is REQUIRED in the PUT schema (InstallationIngressSchema).
 *   To test "no ingress" scenario we delete ingress via Prisma after creating.
 */
import { createAdminClient } from '../support/admin.helper.js';
import { createAuthClient } from '../support/auth.helper.js';
import {
  prisma,
  resetDomainFixtures,
} from '../support/prisma.helper.js';

function uniqueSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe('Platform Installation', () => {
  beforeAll(async () => {
    await prisma.$connect();
    // Clean slate before the whole suite
    await resetDomainFixtures();
  });

  beforeEach(async () => {
    await resetDomainFixtures();
  });

  afterAll(async () => {
    await resetDomainFixtures();
    await prisma.$disconnect();
  });

  it('allows an admin to upsert and read platform installation settings', async () => {
    const { client } = await createAdminClient();
    const suffix = uniqueSuffix();

    const payload = {
      name: `E2E Installation ${suffix}`,
      portalHostname: `portal-${suffix}.e2e.test`,
      tlsAskSecret: `secret-${suffix}`,
      ingress: {
        canonicalTargetHost: `edge-${suffix}.e2e.test`,
        ipv4Addresses: ['203.0.113.10'],
        ipv6Addresses: [],
      },
    };

    // PUT creates the installation
    const upsertRes = await client.put(
      '/api/admin/platform-installation',
      payload
    );
    expect(upsertRes.status).toBe(200);
    expect(upsertRes.data.name).toBe(payload.name);
    expect(upsertRes.data.portalHostname).toBe(payload.portalHostname);
    expect(upsertRes.data.ingress.canonicalTargetHost).toBe(
      payload.ingress.canonicalTargetHost
    );
    expect(upsertRes.data.ingress.ipv4Addresses).toEqual(
      payload.ingress.ipv4Addresses
    );

    // GET returns the same record (PUT response ID must match GET response ID)
    const getRes = await client.get('/api/admin/platform-installation');
    expect(getRes.status).toBe(200);
    expect(getRes.data).not.toBeNull();
    expect(getRes.data.id).toBe(upsertRes.data.id);
    expect(getRes.data.portalHostname).toBe(payload.portalHostname);
    expect(getRes.data.tlsAskSecret).toBe(payload.tlsAskSecret);
  });

  it('updates installation name on second upsert (same record)', async () => {
    const { client } = await createAdminClient();
    const suffix = uniqueSuffix();

    const base = {
      name: `E2E Installation ${suffix}`,
      portalHostname: `portal-${suffix}.e2e.test`,
      tlsAskSecret: `secret-${suffix}`,
      ingress: {
        canonicalTargetHost: `edge-${suffix}.e2e.test`,
        ipv4Addresses: ['203.0.113.10'],
        ipv6Addresses: [],
      },
    };

    const first = await client.put('/api/admin/platform-installation', base);
    expect(first.status).toBe(200);

    // Second PUT updates the same record — change name only, keep ingress same
    // to avoid Prisma nested upsert issues with existing ingress record
    const second = await client.put('/api/admin/platform-installation', {
      ...base,
      name: `E2E Installation ${suffix} Updated`,
    });

    expect(second.status).toBe(200);
    expect(second.data.id).toBe(first.data.id);
    expect(second.data.name).toBe(`E2E Installation ${suffix} Updated`);
    expect(second.data.ingress.ipv4Addresses).toContain('203.0.113.10');
  });

  it('rejects domain space creation when installation has no ingress (Prisma-seeded)', async () => {
    const { client } = await createAdminClient();
    const suffix = uniqueSuffix();

    // Create installation via API (has ingress)
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
    const installationId = putRes.data.id;

    // Delete the ingress directly via Prisma to simulate no-ingress state
    await prisma.installationIngress.deleteMany({
      where: { installationId },
    });

    const createRes = await client.post('/api/admin/domain-spaces', {
      baseDomain: `helix-${suffix}.e2e.test`,
      onboardingMode: 'HYBRID',
      ownershipMethod: 'TXT_TOKEN',
      apexRoutingMethod: 'HTTP_WELL_KNOWN',
      wildcardRoutingMethod: 'HTTP_WELL_KNOWN',
    });
    expect(createRes.status).toBe(400);
  });

  it('rejects domain space when baseDomain matches the portalHostname', async () => {
    const { client } = await createAdminClient();
    const suffix = uniqueSuffix();

    const portalHostname = `portal-${suffix}.e2e.test`;

    const putRes = await client.put('/api/admin/platform-installation', {
      name: `E2E Installation ${suffix}`,
      portalHostname,
      tlsAskSecret: `secret-${suffix}`,
      ingress: {
        canonicalTargetHost: `edge-${suffix}.e2e.test`,
        ipv4Addresses: ['203.0.113.10'],
        ipv6Addresses: [],
      },
    });
    expect(putRes.status).toBe(200);

    const createRes = await client.post('/api/admin/domain-spaces', {
      baseDomain: portalHostname,
      onboardingMode: 'HYBRID',
      ownershipMethod: 'TXT_TOKEN',
      apexRoutingMethod: 'HTTP_WELL_KNOWN',
      wildcardRoutingMethod: 'HTTP_WELL_KNOWN',
    });

    expect(createRes.status).toBeGreaterThanOrEqual(400);
    expect(createRes.status).toBeLessThan(500);
  });

  it('requires admin role to access platform installation endpoint', async () => {
    const anonClient = createAuthClient();
    const res = await anonClient.get('/api/admin/platform-installation');
    expect(res.status).toBe(401);
  });
});
