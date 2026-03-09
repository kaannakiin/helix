import {
  BusinessModel,
  CurrencyCode,
  DomainOnboardingMode,
  DomainOwnershipMethod,
  DomainRoutingMethod,
  DomainSpaceStatus,
  HostBindingStatus,
  HostBindingType,
  InstallationStatus,
  Locale,
  PrismaClient,
  StoreStatus,
  StorefrontStatus,
  VerificationStatus,
} from '@org/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../../../apps/backend/.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required for backend e2e tests.');
}

const adapter = new PrismaPg({ connectionString });

export const prisma: PrismaClient = new PrismaClient({
  adapter,
  omit: {
    user: {
      password: true,
    },
  },
});

export async function resetDomainFixtures() {
  await prisma.storeHostBinding.deleteMany({
    where: {
      OR: [
        { hostname: { contains: '.e2e.test' } },
        { hostname: { startsWith: 'portal-' } },
      ],
    },
  });

  await prisma.domainSpace.deleteMany({
    where: {
      baseDomain: { contains: '.e2e.test' },
    },
  });

  await prisma.installationIngress.deleteMany({
    where: {
      OR: [
        { canonicalTargetHost: { contains: '.e2e.test' } },
        {
          installation: {
            portalHostname: { contains: '.e2e.test' },
          },
        },
      ],
    },
  });

  await prisma.platformInstallation.deleteMany({
    where: {
      portalHostname: { contains: '.e2e.test' },
    },
  });

  await prisma.store.deleteMany({
    where: {
      slug: { startsWith: 'e2e-store-' },
    },
  });
}

// TODO: Re-implement with ABAC when available
export async function elevateUserToAdmin(_email: string) {
  // No-op: UserRole enum removed, ABAC not yet implemented
}

export async function createStoreOnly(suffix: string) {
  const store = await prisma.store.create({
    data: {
      name: `E2E Store ${suffix}`,
      slug: `e2e-store-${suffix}`,
      businessModel: BusinessModel.B2C,
      status: StoreStatus.ACTIVE,
      storefrontStatus: StorefrontStatus.ACTIVE,
      defaultLocale: Locale.TR,
      currency: CurrencyCode.TRY,
    },
  });
  return store;
}

export async function createInstallationWithIngress(suffix: string) {
  const portalHostname = `portal-${suffix}.e2e.test`;
  const installation = await prisma.platformInstallation.create({
    data: {
      name: `E2E Installation ${suffix}`,
      portalHostname,
      tlsAskSecret: `secret-${suffix}`,
      status: InstallationStatus.ACTIVE,
      ingress: {
        create: {
          canonicalTargetHost: `edge-${suffix}.e2e.test`,
          ipv4Addresses: ['203.0.113.10'],
          ipv6Addresses: [],
        },
      },
    },
    include: { ingress: true },
  });
  return { installation, portalHostname };
}

// DomainSpace: ownership VERIFIED (READY), apex/wildcard PENDING
export async function createOwnershipOnlyFixture(suffix: string) {
  const { installation, portalHostname } =
    await createInstallationWithIngress(suffix);
  const store = await createStoreOnly(suffix);
  const baseDomain = `helix-${suffix}.e2e.test`;

  const domainSpace = await prisma.domainSpace.create({
    data: {
      installationId: installation.id,
      baseDomain,
      onboardingMode: DomainOnboardingMode.HYBRID,
      status: DomainSpaceStatus.READY,
      ownershipMethod: DomainOwnershipMethod.TXT_TOKEN,
      ownershipStatus: VerificationStatus.VERIFIED,
      ownershipRecordName: '_helix-verify',
      ownershipRecordValue: `txt-token-${suffix}`,
      ownershipVerifiedAt: new Date(),
      apexRoutingMethod: DomainRoutingMethod.HTTP_WELL_KNOWN,
      apexRoutingStatus: VerificationStatus.PENDING,
      apexChallengeToken: `apex-token-${suffix}`,
      wildcardRoutingMethod: DomainRoutingMethod.HTTP_WELL_KNOWN,
      wildcardRoutingStatus: VerificationStatus.PENDING,
      wildcardProbeHost: `__helix-wildcard-check.${baseDomain}`,
      wildcardChallengeToken: `wildcard-token-${suffix}`,
    },
  });

  return { installation, store, domainSpace, portalHostname, baseDomain };
}

// DomainSpace: apex VERIFIED, wildcard PENDING
export async function createApexOnlyFixture(suffix: string) {
  const { installation, portalHostname } =
    await createInstallationWithIngress(suffix);
  const store = await createStoreOnly(suffix);
  const baseDomain = `helix-${suffix}.e2e.test`;

  const domainSpace = await prisma.domainSpace.create({
    data: {
      installationId: installation.id,
      baseDomain,
      onboardingMode: DomainOnboardingMode.HYBRID,
      status: DomainSpaceStatus.READY,
      ownershipMethod: DomainOwnershipMethod.TXT_TOKEN,
      ownershipStatus: VerificationStatus.VERIFIED,
      ownershipRecordName: '_helix-verify',
      ownershipRecordValue: `txt-token-${suffix}`,
      ownershipVerifiedAt: new Date(),
      apexRoutingMethod: DomainRoutingMethod.HTTP_WELL_KNOWN,
      apexRoutingStatus: VerificationStatus.VERIFIED,
      apexChallengeToken: `apex-token-${suffix}`,
      apexVerifiedAt: new Date(),
      wildcardRoutingMethod: DomainRoutingMethod.HTTP_WELL_KNOWN,
      wildcardRoutingStatus: VerificationStatus.PENDING,
      wildcardProbeHost: `__helix-wildcard-check.${baseDomain}`,
      wildcardChallengeToken: `wildcard-token-${suffix}`,
    },
  });

  return { installation, store, domainSpace, portalHostname, baseDomain };
}

// DomainSpace: wildcard VERIFIED, mode parametrik (HYBRID veya EXACT_HOSTS)
export async function createWildcardFixture(
  suffix: string,
  mode: DomainOnboardingMode
) {
  const { installation, portalHostname } =
    await createInstallationWithIngress(suffix);
  const store = await createStoreOnly(suffix);
  const baseDomain = `helix-${suffix}.e2e.test`;

  const domainSpace = await prisma.domainSpace.create({
    data: {
      installationId: installation.id,
      baseDomain,
      onboardingMode: mode,
      status: DomainSpaceStatus.READY,
      ownershipMethod: DomainOwnershipMethod.TXT_TOKEN,
      ownershipStatus: VerificationStatus.VERIFIED,
      ownershipRecordName: '_helix-verify',
      ownershipRecordValue: `txt-token-${suffix}`,
      ownershipVerifiedAt: new Date(),
      apexRoutingMethod: DomainRoutingMethod.HTTP_WELL_KNOWN,
      apexRoutingStatus: VerificationStatus.PENDING,
      apexChallengeToken: `apex-token-${suffix}`,
      wildcardRoutingMethod: DomainRoutingMethod.HTTP_WELL_KNOWN,
      wildcardRoutingStatus: VerificationStatus.VERIFIED,
      wildcardProbeHost: `__helix-wildcard-check.${baseDomain}`,
      wildcardChallengeToken: `wildcard-token-${suffix}`,
      wildcardVerifiedAt: new Date(),
    },
  });

  return { installation, store, domainSpace, portalHostname, baseDomain };
}

// Pending binding (PENDING_ROUTING, HTTP challenge token set)
export async function createPendingBindingFixture(suffix: string) {
  const { installation, store, domainSpace, portalHostname, baseDomain } =
    await createOwnershipOnlyFixture(suffix);
  const hostname = `shop.${baseDomain}`;

  const binding = await prisma.storeHostBinding.create({
    data: {
      storeId: store.id,
      domainSpaceId: domainSpace.id,
      hostname,
      type: HostBindingType.PRIMARY,
      status: HostBindingStatus.PENDING_ROUTING,
      routingMethod: DomainRoutingMethod.HTTP_WELL_KNOWN,
      routingStatus: VerificationStatus.PENDING,
      challengeToken: `challenge-token-${suffix}`,
    },
  });

  return {
    installation,
    store,
    domainSpace,
    binding,
    portalHostname,
    baseDomain,
    host: hostname,
  };
}

export async function createActiveStoreFixture(suffix: string) {
  const portalHostname = `portal-${suffix}.e2e.test`;
  const baseDomain = `helix-${suffix}.e2e.test`;
  const host = `b2b.${baseDomain}`;

  const installation = await prisma.platformInstallation.create({
    data: {
      name: `E2E Installation ${suffix}`,
      portalHostname,
      tlsAskSecret: `secret-${suffix}`,
      status: InstallationStatus.ACTIVE,
      ingress: {
        create: {
          canonicalTargetHost: `edge-${suffix}.e2e.test`,
          ipv4Addresses: ['203.0.113.10'],
          ipv6Addresses: [],
        },
      },
    },
    include: { ingress: true },
  });

  const store = await prisma.store.create({
    data: {
      name: `E2E Store ${suffix}`,
      slug: `e2e-store-${suffix}`,
      businessModel: BusinessModel.B2C,
      status: StoreStatus.ACTIVE,
      storefrontStatus: StorefrontStatus.ACTIVE,
      defaultLocale: Locale.TR,
      currency: CurrencyCode.TRY,
    },
  });

  const domainSpace = await prisma.domainSpace.create({
    data: {
      installationId: installation.id,
      baseDomain,
      onboardingMode: DomainOnboardingMode.HYBRID,
      status: DomainSpaceStatus.READY,
      ownershipMethod: DomainOwnershipMethod.TXT_TOKEN,
      ownershipStatus: VerificationStatus.VERIFIED,
      ownershipRecordName: '_helix-verify',
      ownershipRecordValue: `txt-token-${suffix}`,
      ownershipVerifiedAt: new Date(),
      apexRoutingMethod: DomainRoutingMethod.HTTP_WELL_KNOWN,
      apexRoutingStatus: VerificationStatus.VERIFIED,
      apexChallengeToken: `apex-token-${suffix}`,
      apexVerifiedAt: new Date(),
      wildcardRoutingMethod: DomainRoutingMethod.HTTP_WELL_KNOWN,
      wildcardRoutingStatus: VerificationStatus.VERIFIED,
      wildcardProbeHost: `__helix-wildcard-check.${baseDomain}`,
      wildcardChallengeToken: `wildcard-token-${suffix}`,
      wildcardVerifiedAt: new Date(),
    },
  });

  const binding = await prisma.storeHostBinding.create({
    data: {
      storeId: store.id,
      domainSpaceId: domainSpace.id,
      hostname: host,
      type: HostBindingType.PRIMARY,
      status: HostBindingStatus.ACTIVE,
      routingMethod: DomainRoutingMethod.HTTP_WELL_KNOWN,
      routingStatus: VerificationStatus.VERIFIED,
      challengeToken: `binding-token-${suffix}`,
      activatedAt: new Date(),
      routingVerifiedAt: new Date(),
    },
  });

  return {
    installation,
    store,
    domainSpace,
    binding,
    portalHostname,
    baseDomain,
    host,
  };
}
