import { hash as argon2Hash } from '@node-rs/argon2';
import { prisma } from '../prisma.js';

// ── Environment helpers ──────────────────────────────────

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`ERROR: Required environment variable ${name} is not set.`);
    process.exit(1);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

// ── Main seed ────────────────────────────────────────────

async function productionSeed() {
  console.log('=== Helix Production Seed ===\n');

  const adminEmail = requireEnv('ADMIN_EMAIL');
  const adminPassword = requireEnv('ADMIN_PASSWORD');
  const adminName = optionalEnv('ADMIN_NAME', 'Admin');
  const adminSurname = optionalEnv('ADMIN_SURNAME', 'User');
  const portalHostname = requireEnv('PORTAL_HOSTNAME');
  const tlsAskSecret = requireEnv('TLS_ASK_SECRET');

  // ── 1. PlatformInstallation ──

  console.log('[1/5] PlatformInstallation...');
  const installation = await prisma.platformInstallation.upsert({
    where: { portalHostname },
    update: { tlsAskSecret },
    create: {
      name: 'Helix Platform',
      portalHostname,
      tlsAskSecret,
      status: 'ACTIVE',
      defaultLocale: 'TR',
      currency: 'TRY',
      timezone: 'Europe/Istanbul',
    },
  });
  console.log(`  -> ${installation.id} (${portalHostname})`);

  // ── 2. Admin User ──

  console.log('[2/5] Admin user...');
  const hashedPassword = await argon2Hash(adminPassword);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: adminName,
      surname: adminSurname,
      email: adminEmail,
      password: hashedPassword,
      emailVerified: true,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log(`  -> ${admin.email} (${admin.id})`);

  // ── 3. Stores ──

  console.log('[3/5] Stores...');
  const storeConfigs = [
    {
      name: 'Helix Toptan',
      slug: 'helix-toptan',
      businessModel: 'B2B' as const,
      description: 'B2B toptan satis kanali.',
    },
    {
      name: 'Helix Magaza',
      slug: 'helix-magaza',
      businessModel: 'B2C' as const,
      description: 'B2C perakende satis kanali.',
    },
  ];

  const storeIds: string[] = [];
  for (const cfg of storeConfigs) {
    const store = await prisma.store.upsert({
      where: { slug: cfg.slug },
      update: { name: cfg.name, description: cfg.description },
      create: {
        ...cfg,
        status: 'ACTIVE',
        defaultLocale: 'TR',
        currency: 'TRY',
        timezone: 'Europe/Istanbul',
      },
    });
    storeIds.push(store.id);
    console.log(`  -> ${store.slug} (${store.id})`);
  }

  // ── 4. Currencies ──

  console.log('[4/5] Currencies...');
  const currencies = [
    {
      code: 'TRY' as const,
      symbol: '₺',
      name: 'Turkish Lira',
      decimalPlaces: 2,
      sortOrder: 0,
      isDefault: true,
      exchangeRate: 1.0,
    },
    {
      code: 'USD' as const,
      symbol: '$',
      name: 'US Dollar',
      decimalPlaces: 2,
      sortOrder: 1,
      isDefault: false,
      exchangeRate: 0.028,
    },
    {
      code: 'EUR' as const,
      symbol: '€',
      name: 'Euro',
      decimalPlaces: 2,
      sortOrder: 2,
      isDefault: false,
      exchangeRate: 0.026,
    },
    {
      code: 'GBP' as const,
      symbol: '£',
      name: 'British Pound',
      decimalPlaces: 2,
      sortOrder: 3,
      isDefault: false,
      exchangeRate: 0.022,
    },
  ];

  for (const c of currencies) {
    await prisma.currency.upsert({
      where: { code: c.code },
      update: { exchangeRate: c.exchangeRate },
      create: c,
    });
  }
  console.log(`  -> ${currencies.map((c) => c.code).join(', ')}`);

  // ── 6. Base PriceList ──

  console.log('[5/5] Base PriceList...');
  if (storeIds.length > 0) {
    const existing = await prisma.priceList.findFirst({
      where: { storeId: storeIds[0], type: 'BASE' },
    });
    if (!existing) {
      await prisma.priceList.create({
        data: {
          name: 'Base Fiyat Listesi (TRY)',
          type: 'BASE',
          status: 'ACTIVE',
          currencyCode: 'TRY',
          storeId: storeIds[0],
          priority: 0,
        },
      });
      console.log('  -> Created for first store');
    } else {
      console.log('  -> Already exists, skipping');
    }
  }

  console.log('\n=== Production seed completed ===');
}

productionSeed()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
