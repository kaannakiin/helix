import { hash as argon2Hash } from '@node-rs/argon2';
import { prisma } from '../prisma.js';

async function baseSeed() {
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
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log(`Admin user created: ${admin.email} (${admin.id})`);

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

  await prisma.priceList.upsert({
    where: { id: 'base-pricelist-try' },
    update: {},
    create: {
      id: 'base-pricelist-try',
      name: 'Varsayılan TRY',
      type: 'BASE',
      status: 'ACTIVE',
      currencyCode: defaultCurrency.code,
      isActive: true,
    },
  });

  console.log(`BASE PriceList seeded for ${defaultCurrency.code}`);

  console.log('Base seed completed!');
}

baseSeed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
