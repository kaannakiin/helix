import { prisma } from '../prisma.js';

async function storeSeed() {
  console.log('Starting store seed...');

  const stores = [
    {
      id: 'store-b2b-merkez',
      name: 'Helix Toptan Merkez',
      slug: 'helix-toptan-merkez',
      businessModel: 'B2B' as const,
      status: 'ACTIVE' as const,
      defaultLocale: 'TR' as const,
      currency: 'TRY' as const,
      timezone: 'Europe/Istanbul',
      description: 'İstanbul Merkez toptan dağıtım ve bayi operasyonları.',
    },
    {
      id: 'store-b2b-ege',
      name: 'Helix Ege Bayi',
      slug: 'helix-ege-bayi',
      businessModel: 'B2B' as const,
      status: 'ACTIVE' as const,
      defaultLocale: 'TR' as const,
      currency: 'TRY' as const,
      timezone: 'Europe/Istanbul',
      description: 'İzmir merkezli Ege ve Akdeniz bölgesi ihracat operasyonları.',
    },
    {
      id: 'store-b2c-istanbul',
      name: 'Helix İstanbul Mağaza',
      slug: 'helix-istanbul',
      businessModel: 'B2C' as const,
      status: 'ACTIVE' as const,
      defaultLocale: 'TR' as const,
      currency: 'TRY' as const,
      timezone: 'Europe/Istanbul',
      description: 'İstanbul amiral mağazası, perakende satış noktası.',
    },
    {
      id: 'store-b2c-ecommerce',
      name: 'Helix E-Ticaret',
      slug: 'helix-ecommerce',
      businessModel: 'B2C' as const,
      status: 'ACTIVE' as const,
      defaultLocale: 'TR' as const,
      currency: 'TRY' as const,
      timezone: 'Europe/Istanbul',
      description: 'Online perakende kanalı, tüm Türkiye teslimat.',
    },
  ];

  for (const store of stores) {
    await prisma.store.upsert({
      where: { id: store.id },
      update: {
        name: store.name,
        status: store.status,
        description: store.description,
      },
      create: store,
    });
  }

  console.log(`Stores seeded: ${stores.map((s) => s.slug).join(', ')}`);
  console.log('Store seed completed!');
}

storeSeed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
