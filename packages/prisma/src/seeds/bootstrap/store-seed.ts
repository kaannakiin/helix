import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../../prisma.js';

export async function runStoreSeed() {
  console.log('Starting store seed...');

  // ── Platform Installation ──
  const pi = await prisma.platformInstallation.upsert({
    where: { portalHostname: 'admin.helix.local' },
    update: {},
    create: {
      name: 'Helix Platform',
      portalHostname: 'admin.helix.local',
      tlsAskSecret: 'dev-tls-secret-placeholder-32chars',
      status: 'ACTIVE',
      defaultLocale: 'TR',
      currency: 'TRY',
      timezone: 'Europe/Istanbul',
    },
  });

  console.log(`Platform installation seeded: ${pi?.id}`);

  // ── Stores ──
  const stores = [
    {
      name: 'Helix Toptan',
      slug: 'helix-toptan',
      businessModel: 'B2B' as const,
      status: 'ACTIVE' as const,
      defaultLocale: 'TR' as const,
      defaultCurrencyCode: 'TRY' as const,
      timezone: 'Europe/Istanbul',
      description: 'B2B toptan satış kanalı.',
    },
    {
      name: 'Helix Mağaza',
      slug: 'helix-magaza',
      businessModel: 'B2C' as const,
      status: 'ACTIVE' as const,
      defaultLocale: 'TR' as const,
      defaultCurrencyCode: 'TRY' as const,
      timezone: 'Europe/Istanbul',
      description: 'B2C perakende satış kanalı.',
    },
  ];

  for (const store of stores) {
    await prisma.store.upsert({
      where: { slug: store.slug },
      update: {
        name: store.name,
        status: store.status,
        description: store.description,
      },
      create: store,
    });
  }

  console.log(`Stores seeded: ${stores.map((s) => `${s.slug}`).join(', ')}`);
  console.log('Store seed completed!');
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectExecution) {
  runStoreSeed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
