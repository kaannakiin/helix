import { hash as argon2Hash } from '@node-rs/argon2';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../../prisma.js';
const CAPABILITIES = {
  // Store-scoped resources
  PRODUCTS_READ: 'products:read',
  PRODUCTS_WRITE: 'products:write',
  PRODUCTS_DELETE: 'products:delete',

  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_WRITE: 'customers:write',
  CUSTOMERS_DELETE: 'customers:delete',

  ORGANIZATIONS_READ: 'organizations:read',
  ORGANIZATIONS_WRITE: 'organizations:write',
  ORGANIZATIONS_DELETE: 'organizations:delete',

  WAREHOUSES_READ: 'warehouses:read',
  WAREHOUSES_WRITE: 'warehouses:write',
  WAREHOUSES_DELETE: 'warehouses:delete',

  PRICE_LISTS_READ: 'price_lists:read',
  PRICE_LISTS_WRITE: 'price_lists:write',
  PRICE_LISTS_DELETE: 'price_lists:delete',

  CUSTOMER_GROUPS_READ: 'customer_groups:read',
  CUSTOMER_GROUPS_WRITE: 'customer_groups:write',
  CUSTOMER_GROUPS_DELETE: 'customer_groups:delete',

  CATEGORIES_READ: 'categories:read',
  CATEGORIES_WRITE: 'categories:write',
  CATEGORIES_DELETE: 'categories:delete',

  // Capability-only resources (no store scoping)
  STORES_READ: 'stores:read',
  STORES_WRITE: 'stores:write',

  BRANDS_READ: 'brands:read',
  BRANDS_WRITE: 'brands:write',
  BRANDS_DELETE: 'brands:delete',

  TAGS_READ: 'tags:read',
  TAGS_WRITE: 'tags:write',
  TAGS_DELETE: 'tags:delete',

  VARIANTS_READ: 'variants:read',
  VARIANTS_WRITE: 'variants:write',

  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',

  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
} as const;

const ALL_CAPABILITIES = Object.values(CAPABILITIES);

export async function runBaseSeed() {
  console.log('Starting base seed...');

  const hashedPassword = await argon2Hash('2401Kaan.!');

  const admin = await prisma.user.upsert({
    where: { email: 'akinkaan49@gmail.com' },
    update: {},
    create: {
      name: 'Kaan',
      surname: 'Akın',
      email: 'akinkaan49@gmail.com',
      password: hashedPassword,
      emailVerified: true,
      status: 'ACTIVE',
    },
  });

  console.log(`Admin user created: ${admin.email} (${admin.id})`);

  // ── Authorization: Full-admin (all capabilities + all stores) ──
  await prisma.userStoreAccess.upsert({
    where: { userId: admin.id },
    update: { allStores: true },
    create: {
      userId: admin.id,
      allStores: true,
    },
  });

  for (const capability of ALL_CAPABILITIES) {
    await prisma.userCapability.upsert({
      where: {
        userId_capability: { userId: admin.id, capability },
      },
      update: {},
      create: { userId: admin.id, capability },
    });
  }

  console.log(
    `Admin authorization seeded: allStores=true, ${ALL_CAPABILITIES.length} capabilities`
  );

  // ── Read-only test user ──
  const readOnlyPassword = await argon2Hash('ReadOnly123!');
  const readOnlyUser = await prisma.user.upsert({
    where: { email: 'readonly@helix.test' },
    update: {},
    create: {
      name: 'Read',
      surname: 'Only',
      email: 'readonly@helix.test',
      password: readOnlyPassword,
      emailVerified: true,
      status: 'ACTIVE',
    },
  });

  await prisma.userStoreAccess.upsert({
    where: { userId: readOnlyUser.id },
    update: { allStores: true },
    create: {
      userId: readOnlyUser.id,
      allStores: true,
    },
  });

  const readCapabilities = [
    CAPABILITIES.PRODUCTS_READ,
    CAPABILITIES.CUSTOMERS_READ,
    CAPABILITIES.ORGANIZATIONS_READ,
    CAPABILITIES.WAREHOUSES_READ,
    CAPABILITIES.PRICE_LISTS_READ,
    CAPABILITIES.CUSTOMER_GROUPS_READ,
    CAPABILITIES.CATEGORIES_READ,
    CAPABILITIES.STORES_READ,
    CAPABILITIES.BRANDS_READ,
    CAPABILITIES.TAGS_READ,
    CAPABILITIES.VARIANTS_READ,
    CAPABILITIES.SETTINGS_READ,
  ];

  for (const capability of readCapabilities) {
    await prisma.userCapability.upsert({
      where: {
        userId_capability: { userId: readOnlyUser.id, capability },
      },
      update: {},
      create: { userId: readOnlyUser.id, capability },
    });
  }

  console.log(
    `Read-only user created: ${readOnlyUser.email} (${readCapabilities.length} read capabilities)`
  );

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
      exchangeRate: 38.5,
    },
    {
      code: 'EUR' as const,
      symbol: '€',
      name: 'Euro',
      decimalPlaces: 2,
      sortOrder: 2,
      isDefault: false,
      exchangeRate: 42.0,
    },
    {
      code: 'GBP' as const,
      symbol: '£',
      name: 'British Pound',
      decimalPlaces: 2,
      sortOrder: 3,
      isDefault: false,
      exchangeRate: 49.0,
    },
  ];

  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: {
        isDefault: currency.isDefault,
        exchangeRate: currency.exchangeRate,
      },
      create: currency,
    });
  }

  console.log(`Currencies seeded: ${currencies.map((c) => c.code).join(', ')}`);

  // ── BASE PriceList for TRY ──
  const defaultCurrency = currencies.find((c) => c.isDefault)!;
  const firstStore = await prisma.store.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (firstStore) {
    await prisma.priceList.upsert({
      where: { id: 'base-pricelist-try' },
      update: {},
      create: {
        id: 'base-pricelist-try',
        name: 'Varsayılan TRY',
        type: 'BASE',
        status: 'ACTIVE',
        defaultCurrencyCode: defaultCurrency.code,
        isActive: true,
        storeId: firstStore.id,
      },
    });
    console.log(`BASE PriceList seeded for ${defaultCurrency.code}`);
  } else {
    console.log(
      'No store found — skipping PriceList seed (run seed:stores first)'
    );
  }

  console.log('Base seed completed!');
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectExecution) {
  runBaseSeed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
