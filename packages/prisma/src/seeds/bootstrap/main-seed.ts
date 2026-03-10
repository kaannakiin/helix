import { resolve } from 'path';
import { CurrencyCode } from 'src/browser.js';
import { fileURLToPath } from 'url';
import { prisma } from '../../prisma.js';
import {
  CATALOG_PRODUCT_SLUG_PREFIX,
  CATALOG_STORE_SLUGS,
} from '../catalog/catalog-seed.config.js';
import { runCatalogSeed } from '../catalog/catalog-seed.js';
import {
  CUSTOMER_ID_PREFIX,
  CUSTOMER_SEED_EMAIL_DOMAIN,
} from '../customer/customer-seed.config.js';
import { runCustomerSeed } from '../customer/customer-seed.js';
import {
  ORG_ID_PREFIX,
  ORG_MEMBER_ID_PREFIX,
} from '../organization/organization-seed.config.js';
import { runOrganizationSeed } from '../organization/organization-seed.js';
import {
  PRICING_EXPECTED_SCENARIO_IDS,
  PRICING_TARGET_STORE_SLUGS,
} from '../pricing/pricing-seed.config.js';
import { runPricingSeed } from '../pricing/pricing-seed.js';
import { runBaseSeed } from './base-seed.js';
import { runStoreSeed } from './store-seed.js';

type ReadinessResult = {
  ready: boolean;
  reason: string;
};

type SeedStep = {
  name: string;
  check: () => Promise<ReadinessResult>;
  run: () => Promise<void>;
};

export async function runMainSeed() {
  console.log('Starting main seed orchestrator...');

  const steps: SeedStep[] = [
    { name: 'base', check: checkBaseReady, run: runBaseSeed },
    { name: 'stores', check: checkStoresReady, run: runStoreSeed },
    { name: 'catalog', check: checkCatalogReady, run: runCatalogSeed },
    { name: 'customers', check: checkCustomersReady, run: runCustomerSeed },
    {
      name: 'organizations',
      check: checkOrganizationsReady,
      run: runOrganizationSeed,
    },
    { name: 'pricing', check: checkPricingReady, run: runPricingSeed },
  ];

  for (const step of steps) {
    const readiness = await step.check();

    if (readiness.ready) {
      console.log(`[skip] ${step.name}: ${readiness.reason}`);
      continue;
    }

    console.log(`[run] ${step.name}: ${readiness.reason}`);
    await step.run();
    console.log(`[done] ${step.name}`);
  }

  console.log('Main seed orchestrator completed.');
}

async function checkBaseReady(): Promise<ReadinessResult> {
  const currencies = await prisma.currency.findMany({
    where: {
      code: {
        in: Object.values(CurrencyCode),
      },
    },
    select: { code: true },
  });

  const found = new Set(currencies.map((currency) => currency.code));
  const missing = Object.values(CurrencyCode).filter(
    (code) => !found.has(code)
  );

  if (missing.length === 0) {
    return {
      ready: true,
      reason: 'required currencies already exist',
    };
  }

  return {
    ready: false,
    reason: `missing currencies: ${missing.join(', ')}`,
  };
}

async function checkStoresReady(): Promise<ReadinessResult> {
  const stores = await prisma.store.findMany({
    where: {
      slug: {
        in: [...CATALOG_STORE_SLUGS],
      },
    },
    select: { slug: true },
  });

  const found = new Set(stores.map((store) => store.slug));
  const missing = CATALOG_STORE_SLUGS.filter((slug) => !found.has(slug));

  if (missing.length === 0) {
    return {
      ready: true,
      reason: 'target store slugs already exist',
    };
  }

  return {
    ready: false,
    reason: `missing stores: ${missing.join(', ')}`,
  };
}

async function checkCatalogReady(): Promise<ReadinessResult> {
  const stores = await loadTargetStores();
  if (stores.length !== PRICING_TARGET_STORE_SLUGS.length) {
    return {
      ready: false,
      reason: 'target stores are not ready yet',
    };
  }

  for (const store of stores) {
    const count = await prisma.productVariant.count({
      where: {
        isActive: true,
        sku: {
          not: null,
        },
        product: {
          is: {
            translations: {
              some: {
                locale: 'EN',
                slug: {
                  startsWith: CATALOG_PRODUCT_SLUG_PREFIX,
                },
              },
            },
            stores: {
              some: {
                storeId: store.id,
                isVisible: true,
              },
            },
          },
        },
      },
    });

    if (count === 0) {
      return {
        ready: false,
        reason: `no seeded active variants visible for ${store.slug}`,
      };
    }
  }

  return {
    ready: true,
    reason: 'seeded catalog variants already exist for both target stores',
  };
}

async function checkCustomersReady(): Promise<ReadinessResult> {
  const stores = await loadTargetStores();
  if (stores.length !== PRICING_TARGET_STORE_SLUGS.length) {
    return {
      ready: false,
      reason: 'target stores are not ready yet',
    };
  }

  for (const store of stores) {
    const count = await prisma.customer.count({
      where: {
        storeId: store.id,
        OR: [
          {
            id: {
              startsWith: CUSTOMER_ID_PREFIX,
            },
          },
          {
            email: {
              endsWith: CUSTOMER_SEED_EMAIL_DOMAIN,
            },
          },
        ],
      },
    });

    if (count === 0) {
      return {
        ready: false,
        reason: `no seeded customers found for ${store.slug}`,
      };
    }
  }

  return {
    ready: true,
    reason: 'seeded customers already exist for both target stores',
  };
}

async function checkOrganizationsReady(): Promise<ReadinessResult> {
  const wholesaleStore = await prisma.store.findUnique({
    where: { slug: 'helix-toptan' },
    select: { id: true },
  });

  if (!wholesaleStore) {
    return {
      ready: false,
      reason: 'helix-toptan store is not ready yet',
    };
  }

  const [orgCount, memberCount] = await Promise.all([
    prisma.organization.count({
      where: {
        storeId: wholesaleStore.id,
        id: {
          startsWith: ORG_ID_PREFIX,
        },
      },
    }),
    prisma.organizationMember.count({
      where: {
        id: {
          startsWith: ORG_MEMBER_ID_PREFIX,
        },
        organization: {
          is: {
            storeId: wholesaleStore.id,
          },
        },
      },
    }),
  ]);

  if (orgCount === 0 || memberCount === 0) {
    return {
      ready: false,
      reason: 'seeded wholesale organizations or members are missing',
    };
  }

  return {
    ready: true,
    reason: 'seeded wholesale organizations already exist',
  };
}

async function checkPricingReady(): Promise<ReadinessResult> {
  const count = await prisma.priceList.count({
    where: {
      id: {
        in: [...PRICING_EXPECTED_SCENARIO_IDS],
      },
    },
  });

  if (count === PRICING_EXPECTED_SCENARIO_IDS.length) {
    return {
      ready: true,
      reason: 'all expected seeded pricing scenarios already exist',
    };
  }

  return {
    ready: false,
    reason: `found ${count}/${PRICING_EXPECTED_SCENARIO_IDS.length} expected seeded pricing scenarios`,
  };
}

async function loadTargetStores() {
  return prisma.store.findMany({
    where: {
      slug: {
        in: [...PRICING_TARGET_STORE_SLUGS],
      },
    },
    select: {
      id: true,
      slug: true,
    },
  });
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectExecution) {
  runMainSeed()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
