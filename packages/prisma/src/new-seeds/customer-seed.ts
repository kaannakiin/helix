import { hash as argon2Hash } from '@node-rs/argon2';
import type { Prisma } from '../client.js';
import { prisma } from '../prisma.js';
import {
  allocateCustomersAcrossStores,
  resolveCustomerSeedCount,
  resolveCustomerSeedPassword,
} from './customer-seed.config.js';
import {
  buildCustomerScenario,
  type SeedCustomerScenario,
} from './customer-seed.utils.js';

async function seedCustomers() {
  const targetCustomerCount = resolveCustomerSeedCount(
    process.env['CUSTOMER_SEED_COUNT'],
  );
  const sharedPassword = resolveCustomerSeedPassword(
    process.env['CUSTOMER_SEED_PASSWORD'],
  );
  const referenceDate = new Date();
  const stores = await prisma.store.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: {
      slug: 'asc',
    },
  });

  if (stores.length === 0) {
    throw new Error(
      'No stores found. Run `npm run seed:stores` in packages/prisma first.',
    );
  }

  const sharedPasswordHash = await argon2Hash(sharedPassword);
  const distribution = allocateCustomersAcrossStores(
    targetCustomerCount,
    stores.length,
  );

  console.log(
    `Starting customer seed v2 with ${targetCustomerCount} customers across ${stores.length} stores...`,
  );

  let globalIndex = 0;
  let totalDeviceCount = 0;
  let totalSessionCount = 0;
  let totalRefreshTokenCount = 0;
  let totalOauthAccountCount = 0;

  const sampleLogins: Array<{ storeSlug: string; email: string }> = [];

  for (const [storeIndex, store] of stores.entries()) {
    const perStoreCount = distribution[storeIndex] ?? 0;

    console.log(`Seeding ${perStoreCount} customers for ${store.slug}...`);

    for (let customerIndex = 0; customerIndex < perStoreCount; customerIndex++) {
      const scenario = await hydrateRefreshTokenHashes(
        buildCustomerScenario({
          store,
          storeIndex,
          customerIndex,
          globalIndex,
          sharedPasswordHash,
          referenceDate,
        }),
      );

      await prisma.$transaction(async (tx) => {
        await upsertCustomerScenario(tx, scenario);
      });

      if (customerIndex === 0) {
        sampleLogins.push({
          storeSlug: store.slug,
          email: scenario.sampleEmail,
        });
      }

      totalDeviceCount += scenario.devices.length;
      totalSessionCount += scenario.sessions.length;
      totalRefreshTokenCount += scenario.refreshTokens.length;
      totalOauthAccountCount += scenario.oauthAccounts.length;
      globalIndex += 1;
    }
  }

  console.log('Customer seed v2 completed.');
  console.log(`Customers: ${globalIndex}`);
  console.log(`Devices: ${totalDeviceCount}`);
  console.log(`Sessions: ${totalSessionCount}`);
  console.log(`Refresh tokens: ${totalRefreshTokenCount}`);
  console.log(`OAuth accounts: ${totalOauthAccountCount}`);
  console.log(`Shared password: ${sharedPassword}`);

  for (const sample of sampleLogins) {
    console.log(`Sample login for ${sample.storeSlug}: ${sample.email}`);
  }
}

async function hydrateRefreshTokenHashes(
  scenario: SeedCustomerScenario,
): Promise<SeedCustomerScenario> {
  const refreshTokens = await Promise.all(
    scenario.refreshTokens.map(async (token) => ({
      ...token,
      tokenHash: await argon2Hash(`seed-refresh-token:${token.id}`),
    })),
  );

  return {
    ...scenario,
    refreshTokens,
  };
}

async function upsertCustomerScenario(
  tx: Prisma.TransactionClient,
  scenario: SeedCustomerScenario,
) {
  const customer = scenario.customer;

  await tx.customer.upsert({
    where: {
      id: customer.id,
    },
    create: customer,
    update: {
      storeId: customer.storeId,
      name: customer.name,
      surname: customer.surname,
      email: customer.email,
      phone: customer.phone,
      password: customer.password,
      emailVerified: customer.emailVerified,
      phoneVerified: customer.phoneVerified,
      avatar: customer.avatar,
      status: customer.status,
      accountType: customer.accountType,
      twoFactorEnabled: customer.twoFactorEnabled,
      twoFactorSecret: customer.twoFactorSecret,
      lastLoginAt: customer.lastLoginAt,
      loginCount: customer.loginCount,
      createdAt: customer.createdAt,
    },
  });

  for (const device of scenario.devices) {
    await tx.customerDevice.upsert({
      where: {
        id: device.id,
      },
      create: device,
      update: {
        customerId: device.customerId,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        browserName: device.browserName,
        browserVersion: device.browserVersion,
        osName: device.osName,
        osVersion: device.osVersion,
        fingerprint: device.fingerprint,
        isTrusted: device.isTrusted,
        firstSeenAt: device.firstSeenAt,
        lastSeenAt: device.lastSeenAt,
      },
    });
  }

  for (const session of scenario.sessions) {
    await tx.customerSession.upsert({
      where: {
        id: session.id,
      },
      create: session,
      update: {
        customerId: session.customerId,
        sessionToken: session.sessionToken,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        browserName: session.browserName,
        browserVersion: session.browserVersion,
        osName: session.osName,
        osVersion: session.osVersion,
        deviceType: session.deviceType,
        city: session.city,
        country: session.country,
        lat: session.lat,
        lng: session.lng,
        isActive: session.isActive,
        revokedAt: session.revokedAt,
        revokeReason: session.revokeReason,
        deviceId: session.deviceId,
        createdAt: session.createdAt,
        lastActivityAt: session.lastActivityAt,
        expiresAt: session.expiresAt,
      },
    });
  }

  for (const token of scenario.refreshTokens) {
    await tx.customerRefreshToken.upsert({
      where: {
        id: token.id,
      },
      create: token,
      update: {
        customerId: token.customerId,
        sessionId: token.sessionId,
        tokenHash: token.tokenHash,
        family: token.family,
        isRevoked: token.isRevoked,
        replacedByTokenId: token.replacedByTokenId,
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
      },
    });
  }

  for (const oauthAccount of scenario.oauthAccounts) {
    await tx.customerOAuthAccount.upsert({
      where: {
        id: oauthAccount.id,
      },
      create: oauthAccount,
      update: {
        customerId: oauthAccount.customerId,
        provider: oauthAccount.provider,
        providerAccountId: oauthAccount.providerAccountId,
        accessToken: oauthAccount.accessToken,
        refreshToken: oauthAccount.refreshToken,
        tokenExpiry: oauthAccount.tokenExpiry,
        scope: oauthAccount.scope,
        createdAt: oauthAccount.createdAt,
      },
    });
  }
}

seedCustomers()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
