import { HostBindingStatus } from '@org/prisma/client';
import { createAdminClient } from '../support/admin.helper.js';
import { createAuthClient } from '../support/auth.helper.js';
import {
  createActiveStoreFixture,
  prisma,
  resetDomainFixtures,
} from '../support/prisma.helper.js';

function uniqueSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Smoke tests — happy path only.
 *
 * PlatformInstallation is a singleton: findCurrent() returns the OLDEST record.
 * Each test resets ALL domain fixtures first so the installation it creates
 * is guaranteed to be the oldest (only) one in the DB.
 */
describe('Domain management — smoke flows (happy path)', () => {
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

    // GET returns the installation — with maxWorkers=1 and beforeEach reset,
    // our PUT created the only installation so GET returns the same record.
    const getRes = await client.get('/api/admin/platform-installation');

    expect(getRes.status).toBe(200);
    expect(getRes.data).not.toBeNull();
    expect(getRes.data.id).toBe(upsertRes.data.id);
    expect(getRes.data.portalHostname).toBe(payload.portalHostname);
    expect(getRes.data.tlsAskSecret).toBe(payload.tlsAskSecret);
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
    expect(createRes.data.ownership.record).toEqual({
      type: 'TXT',
      name: '_helix-verify',
      value: createRes.data.ownership.record.value,
    });
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

  it('creates an active store host binding for an already active domain space', async () => {
    const { client } = await createAdminClient();
    const suffix = uniqueSuffix();
    const fixture = await createActiveStoreFixture(suffix);

    const createRes = await client.post('/api/admin/store-host-bindings', {
      storeId: fixture.store.id,
      domainSpaceId: fixture.domainSpace.id,
      hostname: fixture.baseDomain,
      type: 'PRIMARY',
    });

    expect(createRes.status).toBe(201);
    expect(createRes.data.hostname).toBe(fixture.baseDomain);
    expect(createRes.data.status).toBe(HostBindingStatus.ACTIVE);
    expect(createRes.data.activatedAt).toBeDefined();
    expect(createRes.data.routing.dns).toEqual([
      { type: 'A', name: '@', value: '203.0.113.10' },
    ]);
    expect(createRes.data.activationSource).toBe('DOMAIN_APEX');

    const listRes = await client.get('/api/admin/store-host-bindings', {
      params: { storeId: fixture.store.id },
    });

    expect(listRes.status).toBe(200);
    expect(
      listRes.data.some((binding: { hostname: string }) => {
        return binding.hostname === fixture.baseDomain;
      })
    ).toBe(true);
  });

  it('authorizes TLS and resolves a seeded active storefront host', async () => {
    const suffix = uniqueSuffix();
    const fixture = await createActiveStoreFixture(suffix);
    const publicClient = createAuthClient();

    const askHttpRes = await publicClient.get('/api/storefront/domains/ask', {
      params: {
        domain: fixture.host,
        token: fixture.installation.tlsAskSecret,
      },
    });

    expect(askHttpRes.status).toBe(200);
    expect(askHttpRes.data).toEqual({ authorized: true });

    const resolveHttpRes = await publicClient.get(
      '/api/storefront/domains/resolve',
      {
        params: {
          hostname: fixture.host,
        },
      }
    );

    expect(resolveHttpRes.status).toBe(200);
    expect(resolveHttpRes.data.hostname).toBe(fixture.host);
    expect(resolveHttpRes.data.store.id).toBe(fixture.store.id);
    expect(resolveHttpRes.data.domainSpace.id).toBe(fixture.domainSpace.id);

    const challengeHttpRes = await publicClient.get(
      '/.well-known/helix-routing',
      {
        headers: {
          Host: fixture.host,
        },
      }
    );

    expect(challengeHttpRes.status).toBe(200);
    expect(challengeHttpRes.data).toBe(`binding-token-${suffix}`);
  });
});
