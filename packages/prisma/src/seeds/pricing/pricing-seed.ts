import { resolve } from 'path';
import { fileURLToPath } from 'url';
import type { CurrencyCode, Prisma, TaxBehavior } from '../../client.js';
import { prisma } from '../../prisma.js';
import {
  CUSTOMER_ID_PREFIX,
  CUSTOMER_SEED_EMAIL_DOMAIN,
} from '../customer/customer-seed.config.js';
import { ORG_ID_PREFIX } from '../organization/organization-seed.config.js';
import {
  PRICING_ARCHIVED_VARIANT_COUNT,
  PRICING_CUSTOMER_GROUP_IDS,
  PRICING_REQUIRED_CURRENCIES,
  PRICING_SYSTEM_BASE_PRICE_LIST_IDS,
  PRICING_TARGET_STORE_SLUGS,
  PRICING_VARIANT_SAMPLE_LIMIT,
  type PricingStoreSlug,
} from './pricing-seed.config.js';
import {
  type PricingAssignmentKind,
  PRICING_SCENARIOS as PRICING_SCENARIO_DEFINITIONS,
  type PricingScenarioDefinition,
} from './pricing-seed.data.js';
import {
  buildBasePrice,
  buildCompareAtPrice,
  buildCostPrice,
  buildExchangeSourcePrice,
  shiftDays,
} from './pricing-seed.utils.js';

type SeedStore = {
  id: string;
  slug: PricingStoreSlug;
  name: string;
  defaultCurrencyCode: CurrencyCode;
  defaultBasePriceListId: string | null;
};

type DefaultBasePriceListRef = {
  id: string;
  defaultCurrencyCode: CurrencyCode;
};

type VariantSample = {
  id: string;
  sku: string;
};

type StoreContext = {
  store: SeedStore;
  storeIndex: number;
  defaultBasePriceList: DefaultBasePriceListRef;
  sampledVariants: VariantSample[];
  firstCustomerId: string;
  firstOrganizationId: string;
  customerGroupId: string;
};

type PricingRowInput = Prisma.PriceListPriceCreateManyInput;

const TAX_BEHAVIORS: readonly TaxBehavior[] = [
  'INCLUSIVE',
  'EXCLUSIVE',
  'UNSPECIFIED',
];

export async function runPricingSeed() {
  console.log('Starting pricing seed...');

  const stores = await loadTargetStores();
  await ensureStoreCurrencyPolicies(stores);

  const defaultBasePriceLists = new Map<PricingStoreSlug, DefaultBasePriceListRef>();
  for (const store of stores) {
    defaultBasePriceLists.set(
      store.slug,
      await ensureDefaultBasePriceList(store),
    );
  }

  const unitOfMeasureId = await ensurePcUnitOfMeasure();
  const sampledVariantsByStore = await loadSampledVariants(stores);

  for (const store of stores) {
    const sampledVariants = sampledVariantsByStore.get(store.slug) ?? [];
    if (sampledVariants.length === 0) {
      throw new Error(
        `No active seeded variants found for ${store.slug}. Run \`npm run seed:products\` first.`,
      );
    }

    await ensureVariantUnits(sampledVariants, unitOfMeasureId);
    await ensureDefaultBaseRows({
      store,
      sampledVariants,
      unitOfMeasureId,
      basePriceList: defaultBasePriceLists.get(store.slug)!,
      storeIndex: stores.findIndex((entry) => entry.slug === store.slug),
    });
  }

  const contexts = await buildStoreContexts({
    stores,
    defaultBasePriceLists,
    sampledVariantsByStore,
  });

  let totalPriceLists = 0;
  let totalRows = 0;
  let totalAssignments = 0;

  for (const scenario of PRICING_SCENARIO_DEFINITIONS) {
    const context = contexts.get(scenario.storeSlug);
    if (!context) {
      throw new Error(`Missing store context for ${scenario.storeSlug}`);
    }

    const rowCount = await upsertPricingScenario({
      scenario,
      context,
      unitOfMeasureId,
      referenceDate: new Date(),
    });

    totalPriceLists += 1;
    totalRows += rowCount.rows;
    totalAssignments += rowCount.assignments;
  }

  console.log('Pricing seed completed.');
  console.log(`Price lists: ${totalPriceLists}`);
  console.log(`Price rows: ${totalRows}`);
  console.log(`Assignments: ${totalAssignments}`);
}

async function loadTargetStores(): Promise<SeedStore[]> {
  const stores = await prisma.store.findMany({
    where: {
      slug: {
        in: [...PRICING_TARGET_STORE_SLUGS],
      },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      defaultCurrencyCode: true,
      defaultBasePriceListId: true,
    },
    orderBy: {
      slug: 'asc',
    },
  });

  if (stores.length !== PRICING_TARGET_STORE_SLUGS.length) {
    const found = new Set(stores.map((store) => store.slug));
    const missing = PRICING_TARGET_STORE_SLUGS.filter((slug) => !found.has(slug));
    throw new Error(
      `Required stores are missing (${missing.join(', ')}). Run \`npm run seed:stores\` first.`,
    );
  }

  return stores.map((store) => ({
    ...store,
    slug: store.slug as PricingStoreSlug,
  }));
}

async function ensureStoreCurrencyPolicies(stores: SeedStore[]) {
  for (const store of stores) {
    const existing = await prisma.storeCurrency.findMany({
      where: { storeId: store.id },
      select: { currencyCode: true },
    });

    const existingCodes = new Set(existing.map((entry) => entry.currencyCode));
    const missingCodes = PRICING_REQUIRED_CURRENCIES.filter(
      (currencyCode) => !existingCodes.has(currencyCode),
    );

    if (missingCodes.length === 0) {
      continue;
    }

    await prisma.storeCurrency.createMany({
      data: missingCodes.map((currencyCode) => ({
        storeId: store.id,
        currencyCode,
        isSelectable: true,
        allowCheckout: true,
        sortOrder: PRICING_REQUIRED_CURRENCIES.indexOf(currencyCode),
      })),
    });
  }
}

async function ensureDefaultBasePriceList(
  store: SeedStore,
): Promise<DefaultBasePriceListRef> {
  if (store.defaultBasePriceListId) {
    const current = await prisma.priceList.findUnique({
      where: { id: store.defaultBasePriceListId },
      select: {
        id: true,
        type: true,
        defaultCurrencyCode: true,
      },
    });

    if (current && current.type === 'BASE') {
      return {
        id: current.id,
        defaultCurrencyCode: current.defaultCurrencyCode,
      };
    }
  }

  const existingSystemManaged = await prisma.priceList.findFirst({
    where: {
      storeId: store.id,
      type: 'BASE',
      isSystemManaged: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
      defaultCurrencyCode: true,
    },
  });

  const basePriceList =
    existingSystemManaged ??
    (await prisma.priceList.create({
      data: {
        id: PRICING_SYSTEM_BASE_PRICE_LIST_IDS[store.slug as PricingStoreSlug],
        name: `${store.name} - Default`,
        storeId: store.id,
        type: 'BASE',
        status: 'ACTIVE',
        defaultCurrencyCode: store.defaultCurrencyCode,
        priority: 0,
        isActive: true,
        isSystemManaged: true,
      },
      select: {
        id: true,
        defaultCurrencyCode: true,
      },
    }));

  await prisma.store.update({
    where: { id: store.id },
    data: {
      defaultBasePriceListId: basePriceList.id,
    },
  });

  return basePriceList;
}

async function ensurePcUnitOfMeasure(): Promise<string> {
  const existing = await prisma.unitOfMeasure.findUnique({
    where: { code: 'PC' },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const created = await prisma.unitOfMeasure.create({
    data: {
      id: 'default_uom_pc',
      code: 'PC',
      isActive: true,
      sortOrder: 0,
      translations: {
        create: [
          {
            locale: 'EN',
            name: 'Piece',
            abbreviation: 'pc',
          },
          {
            locale: 'TR',
            name: 'Adet',
            abbreviation: 'ad',
          },
        ],
      },
    },
    select: { id: true },
  });

  return created.id;
}

async function loadSampledVariants(
  stores: SeedStore[],
): Promise<Map<PricingStoreSlug, VariantSample[]>> {
  const result = new Map<PricingStoreSlug, VariantSample[]>();

  for (const store of stores) {
    const variants = await prisma.productVariant.findMany({
      where: {
        isActive: true,
        sku: {
          not: null,
        },
        product: {
          is: {
            stores: {
              some: {
                storeId: store.id,
                isVisible: true,
              },
            },
          },
        },
      },
      select: {
        id: true,
        sku: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: PRICING_VARIANT_SAMPLE_LIMIT,
    });

    result.set(
      store.slug,
      variants
        .filter((variant): variant is VariantSample => Boolean(variant.sku))
        .map((variant) => ({
          id: variant.id,
          sku: variant.sku!,
        })),
    );
  }

  return result;
}

async function ensureVariantUnits(
  variants: VariantSample[],
  unitOfMeasureId: string,
) {
  for (const variant of variants) {
    await prisma.productUnitOfMeasure.upsert({
      where: {
        productVariantId_unitOfMeasureId: {
          productVariantId: variant.id,
          unitOfMeasureId,
        },
      },
      create: {
        productVariantId: variant.id,
        unitOfMeasureId,
        isBase: true,
        conversionFactor: 1,
      },
      update: {
        isBase: true,
        conversionFactor: 1,
      },
    });
  }
}

async function ensureDefaultBaseRows(input: {
  store: SeedStore;
  basePriceList: DefaultBasePriceListRef;
  sampledVariants: VariantSample[];
  unitOfMeasureId: string;
  storeIndex: number;
}) {
  const {
    store,
    basePriceList,
    sampledVariants,
    unitOfMeasureId,
    storeIndex,
  } = input;

  for (const [variantIndex, variant] of sampledVariants.entries()) {
    await prisma.priceListPrice.upsert({
      where: {
        priceListId_productVariantId_currencyCode_unitOfMeasureId_minQuantity: {
          priceListId: basePriceList.id,
          productVariantId: variant.id,
          currencyCode: basePriceList.defaultCurrencyCode,
          unitOfMeasureId,
          minQuantity: 1,
        },
      },
      create: {
        priceListId: basePriceList.id,
        productVariantId: variant.id,
        originType: 'FIXED',
        price: buildBasePrice({
          currencyCode: basePriceList.defaultCurrencyCode,
          storeIndex,
          variantIndex,
        }),
        compareAtPrice: buildCompareAtPrice(
          buildBasePrice({
            currencyCode: basePriceList.defaultCurrencyCode,
            storeIndex,
            variantIndex,
          }),
        ),
        costPrice: buildCostPrice(
          buildBasePrice({
            currencyCode: basePriceList.defaultCurrencyCode,
            storeIndex,
            variantIndex,
          }),
        ),
        currencyCode: basePriceList.defaultCurrencyCode,
        minQuantity: 1,
        unitOfMeasureId,
        taxBehavior: 'INCLUSIVE',
        conditionType: `BASE-${store.slug.toUpperCase()}`,
      },
      update: {},
    });
  }
}

async function buildStoreContexts(input: {
  stores: SeedStore[];
  defaultBasePriceLists: Map<PricingStoreSlug, DefaultBasePriceListRef>;
  sampledVariantsByStore: Map<PricingStoreSlug, VariantSample[]>;
}): Promise<Map<PricingStoreSlug, StoreContext>> {
  const contexts = new Map<PricingStoreSlug, StoreContext>();

  for (const [storeIndex, store] of input.stores.entries()) {
    const sampledVariants = input.sampledVariantsByStore.get(store.slug) ?? [];
    const defaultBasePriceList = input.defaultBasePriceLists.get(store.slug);

    if (!defaultBasePriceList) {
      throw new Error(`Missing default base price list for ${store.slug}`);
    }

    const seededCustomers = await prisma.customer.findMany({
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
      select: { id: true },
      orderBy: {
        createdAt: 'asc',
      },
      take: 12,
    });

    if (seededCustomers.length === 0) {
      throw new Error(
        `No seeded customers found for ${store.slug}. Run \`npm run seed:customers\` first.`,
      );
    }

    const seededOrganizations = await prisma.organization.findMany({
      where: {
        storeId: store.id,
        id: {
          startsWith: ORG_ID_PREFIX,
        },
      },
      select: { id: true },
      orderBy: {
        createdAt: 'asc',
      },
      take: 8,
    });

    if (store.slug === 'helix-toptan' && seededOrganizations.length === 0) {
      throw new Error(
        'No seeded organizations found for helix-toptan. Run `npm run seed:organizations` first.',
      );
    }

    const customerGroupId = await ensureCustomerGroup({
      store,
      customerIds: seededCustomers.map((customer) => customer.id),
      organizationIds: seededOrganizations.map((organization) => organization.id),
    });

    contexts.set(store.slug, {
      store,
      storeIndex,
      defaultBasePriceList,
      sampledVariants,
      firstCustomerId: seededCustomers[0]!.id,
      firstOrganizationId: seededOrganizations[0]?.id ?? '',
      customerGroupId,
    });
  }

  return contexts;
}

async function ensureCustomerGroup(input: {
  store: SeedStore;
  customerIds: string[];
  organizationIds: string[];
}): Promise<string> {
  const { store, customerIds, organizationIds } = input;
  const groupId = PRICING_CUSTOMER_GROUP_IDS[store.slug];

  const group =
    store.slug === 'helix-magaza'
      ? {
          id: groupId,
          name: 'Seed VIP Customers',
          description: 'Seed-managed VIP customers for pricing assignment coverage.',
          color: '#8f44fd',
        }
      : {
          id: groupId,
          name: 'Seed Reseller Organizations',
          description: 'Seed-managed reseller organizations for wholesale pricing.',
          color: '#0f766e',
        };

  await prisma.customerGroup.upsert({
    where: { id: group.id },
    create: {
      id: group.id,
      name: group.name,
      description: group.description,
      color: group.color,
      type: 'MANUAL',
      storeId: store.id,
      isActive: true,
      cronExpression: '0 * * * *',
    },
    update: {
      name: group.name,
      description: group.description,
      color: group.color,
      type: 'MANUAL',
      storeId: store.id,
      isActive: true,
      cronExpression: '0 * * * *',
    },
  });

  await prisma.customerGroupMember.deleteMany({
    where: {
      customerGroupId: group.id,
    },
  });

  const memberData =
    store.slug === 'helix-magaza'
      ? customerIds.slice(0, 8).map((customerId) => ({
          customerGroupId: group.id,
          customerId,
          organizationId: null,
        }))
      : organizationIds.slice(0, 6).map((organizationId) => ({
          customerGroupId: group.id,
          customerId: null,
          organizationId,
        }));

  if (memberData.length === 0) {
    throw new Error(`No seed members available for customer group ${group.id}`);
  }

  await prisma.customerGroupMember.createMany({
    data: memberData,
  });

  return group.id;
}

async function upsertPricingScenario(input: {
  scenario: PricingScenarioDefinition;
  context: StoreContext;
  unitOfMeasureId: string;
  referenceDate: Date;
}): Promise<{ rows: number; assignments: number }> {
  const { scenario, context, unitOfMeasureId, referenceDate } = input;

  const parentPriceListId =
    scenario.parentMode === 'STORE_DEFAULT_BASE'
      ? context.defaultBasePriceList.id
      : null;

  const priceList = await prisma.priceList.upsert({
    where: { id: scenario.id },
    create: {
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      storeId: context.store.id,
      type: scenario.type,
      status: scenario.status,
      defaultCurrencyCode: scenario.defaultCurrencyCode,
      parentPriceListId,
      adjustmentType: scenario.type === 'BASE' ? null : scenario.listAdjustmentType,
      adjustmentValue: scenario.type === 'BASE' ? null : scenario.listAdjustmentValue,
      validFrom:
        scenario.validFromOffsetDays === null
          ? null
          : shiftDays(referenceDate, scenario.validFromOffsetDays),
      validTo:
        scenario.validToOffsetDays === null
          ? null
          : shiftDays(referenceDate, scenario.validToOffsetDays),
      priority: scenario.priority,
      isActive: scenario.isActive,
      isSystemManaged: false,
      sourceSystem: scenario.sourceSystem,
      isSourceLocked: scenario.isSourceLocked,
      isExchangeRateDerived: scenario.isExchangeRateDerived,
      sourceCurrencyCode: scenario.isExchangeRateDerived
        ? scenario.sourceCurrencyCode
        : null,
      roundingRule: scenario.isExchangeRateDerived
        ? scenario.roundingRule
        : 'NONE',
      contractRef: scenario.contractRef,
    },
    update: {
      name: scenario.name,
      description: scenario.description,
      storeId: context.store.id,
      type: scenario.type,
      status: scenario.status,
      defaultCurrencyCode: scenario.defaultCurrencyCode,
      parentPriceListId,
      adjustmentType: scenario.type === 'BASE' ? null : scenario.listAdjustmentType,
      adjustmentValue: scenario.type === 'BASE' ? null : scenario.listAdjustmentValue,
      validFrom:
        scenario.validFromOffsetDays === null
          ? null
          : shiftDays(referenceDate, scenario.validFromOffsetDays),
      validTo:
        scenario.validToOffsetDays === null
          ? null
          : shiftDays(referenceDate, scenario.validToOffsetDays),
      priority: scenario.priority,
      isActive: scenario.isActive,
      isSystemManaged: false,
      sourceSystem: scenario.sourceSystem,
      isSourceLocked: scenario.isSourceLocked,
      isExchangeRateDerived: scenario.isExchangeRateDerived,
      sourceCurrencyCode: scenario.isExchangeRateDerived
        ? scenario.sourceCurrencyCode
        : null,
      roundingRule: scenario.isExchangeRateDerived
        ? scenario.roundingRule
        : 'NONE',
      contractRef: scenario.contractRef,
    },
    select: { id: true },
  });

  const rows = assertUniqueScenarioRows(
    buildScenarioRows({
      scenario,
      unitOfMeasureId,
      variants: context.sampledVariants,
      storeIndex: context.storeIndex,
      referenceDate,
    }),
    scenario.id,
  );
  const assignments = buildScenarioAssignments(
    scenario.assignmentKind,
    context,
    priceList.id,
  );

  await prisma.$transaction(async (tx) => {
    await tx.priceListPrice.deleteMany({
      where: {
        priceListId: priceList.id,
      },
    });

    await tx.priceListAssignment.deleteMany({
      where: {
        priceListId: priceList.id,
      },
    });

    if (rows.length > 0) {
      await tx.priceListPrice.createMany({
        data: rows.map((row) => ({
          ...row,
          priceListId: priceList.id,
        })),
      });
    }

    if (assignments.length > 0) {
      await tx.priceListAssignment.createMany({
        data: assignments,
      });
    }
  });

  return { rows: rows.length, assignments: assignments.length };
}

function buildScenarioAssignments(
  assignmentKind: PricingAssignmentKind,
  context: StoreContext,
  priceListId: string,
): Prisma.PriceListAssignmentCreateManyInput[] {
  switch (assignmentKind) {
    case 'NONE':
      return [];
    case 'ALL_CUSTOMERS':
      return [
        {
          priceListId,
          targetType: 'ALL_CUSTOMERS',
          customerGroupId: null,
          organizationId: null,
          customerId: null,
          priority: 0,
        },
      ];
    case 'CUSTOMER_GROUP':
      return [
        {
          priceListId,
          targetType: 'CUSTOMER_GROUP',
          customerGroupId: context.customerGroupId,
          organizationId: null,
          customerId: null,
          priority: 10,
        },
      ];
    case 'CUSTOMER':
      return [
        {
          priceListId,
          targetType: 'CUSTOMER',
          customerGroupId: null,
          organizationId: null,
          customerId: context.firstCustomerId,
          priority: 20,
        },
      ];
    case 'ORGANIZATION':
      if (!context.firstOrganizationId) {
        throw new Error(
          `Missing seeded organization for organization assignment on ${context.store.slug}`,
        );
      }
      return [
        {
          priceListId,
          targetType: 'ORGANIZATION',
          customerGroupId: null,
          organizationId: context.firstOrganizationId,
          customerId: null,
          priority: 5,
        },
      ];
  }
}

function assertUniqueScenarioRows(
  rows: PricingRowInput[],
  scenarioId: string,
): PricingRowInput[] {
  const seen = new Set<string>();

  for (const row of rows) {
    const key = [
      row.productVariantId,
      row.currencyCode,
      row.unitOfMeasureId,
      row.minQuantity,
    ].join('|');

    if (seen.has(key)) {
      throw new Error(
        `Duplicate pricing row key generated for ${scenarioId}: ${key}`,
      );
    }

    seen.add(key);
  }

  return rows;
}

function buildScenarioRows(input: {
  scenario: PricingScenarioDefinition;
  variants: VariantSample[];
  unitOfMeasureId: string;
  storeIndex: number;
  referenceDate: Date;
}): PricingRowInput[] {
  const { scenario, unitOfMeasureId, storeIndex, referenceDate } = input;
  const variantCount =
    scenario.status === 'ARCHIVED'
      ? PRICING_ARCHIVED_VARIANT_COUNT
      : scenario.variantCount;
  const variants = input.variants.slice(0, Math.min(input.variants.length, variantCount));

  if (variants.length === 0) {
    throw new Error(`No variants available for scenario ${scenario.id}`);
  }

  const rows: PricingRowInput[] = [];

  const pushFixedRow = (params: {
    variantId: string;
    variantIndex: number;
    minQuantity?: number;
    maxQuantity?: number | null;
    validFromOffsetDays?: number | null;
    validToOffsetDays?: number | null;
    taxBehavior?: TaxBehavior;
    conditionType?: string | null;
    priceShift?: number;
    sourceAppliedExchangeRate?: number | null;
  }) => {
    const minQuantity = params.minQuantity ?? 1;
    const price =
      buildBasePrice({
        currencyCode: scenario.defaultCurrencyCode,
        storeIndex,
        variantIndex: params.variantIndex,
        quantityTier: minQuantity > 1 ? 1 : 0,
      }) + (params.priceShift ?? 0);

    const row: PricingRowInput = {
      priceListId: scenario.id,
      productVariantId: params.variantId,
      originType: 'FIXED',
      price,
      compareAtPrice: buildCompareAtPrice(price),
      costPrice: buildCostPrice(price),
      adjustmentType: null,
      adjustmentValue: null,
      currencyCode: scenario.defaultCurrencyCode,
      minQuantity,
      maxQuantity: params.maxQuantity ?? null,
      unitOfMeasureId,
      taxBehavior: params.taxBehavior ?? TAX_BEHAVIORS[params.variantIndex % TAX_BEHAVIORS.length]!,
      validFrom:
        params.validFromOffsetDays === undefined || params.validFromOffsetDays === null
          ? null
          : shiftDays(referenceDate, params.validFromOffsetDays),
      validTo:
        params.validToOffsetDays === undefined || params.validToOffsetDays === null
          ? null
          : shiftDays(referenceDate, params.validToOffsetDays),
      conditionType: params.conditionType ?? null,
      isSourceLocked: scenario.isSourceLocked,
      sourcePrice:
        params.sourceAppliedExchangeRate && scenario.isExchangeRateDerived
          ? buildExchangeSourcePrice(price, params.sourceAppliedExchangeRate)
          : null,
      sourceAppliedExchangeRate:
        params.sourceAppliedExchangeRate && scenario.isExchangeRateDerived
          ? params.sourceAppliedExchangeRate
          : null,
      lastRateComputedAt:
        params.sourceAppliedExchangeRate && scenario.isExchangeRateDerived
          ? referenceDate
          : null,
    };

    rows.push(row);
  };

  const pushRelativeRow = (params: {
    variantId: string;
    variantIndex: number;
    adjustmentType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    adjustmentValue: number;
    minQuantity?: number;
    maxQuantity?: number | null;
    validFromOffsetDays?: number | null;
    validToOffsetDays?: number | null;
    taxBehavior?: TaxBehavior;
    conditionType?: string | null;
  }) => {
    rows.push({
      priceListId: scenario.id,
      productVariantId: params.variantId,
      originType: 'RELATIVE',
      price: null,
      compareAtPrice: null,
      costPrice: null,
      adjustmentType: params.adjustmentType,
      adjustmentValue: params.adjustmentValue,
      currencyCode: scenario.defaultCurrencyCode,
      minQuantity: params.minQuantity ?? 1,
      maxQuantity: params.maxQuantity ?? null,
      unitOfMeasureId,
      taxBehavior:
        params.taxBehavior ?? TAX_BEHAVIORS[params.variantIndex % TAX_BEHAVIORS.length]!,
      validFrom:
        params.validFromOffsetDays === undefined || params.validFromOffsetDays === null
          ? null
          : shiftDays(referenceDate, params.validFromOffsetDays),
      validTo:
        params.validToOffsetDays === undefined || params.validToOffsetDays === null
          ? null
          : shiftDays(referenceDate, params.validToOffsetDays),
      conditionType: params.conditionType ?? null,
      isSourceLocked: scenario.isSourceLocked,
      sourcePrice: null,
      sourceAppliedExchangeRate: null,
      lastRateComputedAt: null,
    });
  };

  for (const [variantIndex, variant] of variants.entries()) {
    switch (scenario.rowTemplate) {
      case 'BASE_FIXED':
        pushFixedRow({
          variantId: variant.id,
          variantIndex,
          conditionType: 'BASE',
        });
        if (variantIndex === 0) {
          pushFixedRow({
            variantId: variant.id,
            variantIndex,
            minQuantity: 10,
            maxQuantity: 49,
            conditionType: 'BASE-BREAK',
            priceShift: -2.5,
          });
        }
        break;
      case 'PROMO_MIXED':
        if (variantIndex % 3 === 0) {
          pushFixedRow({
            variantId: variant.id,
            variantIndex,
            validFromOffsetDays: -2,
            validToOffsetDays: 14,
            conditionType: 'PR00',
          });
        } else if (variantIndex % 3 === 1) {
          pushRelativeRow({
            variantId: variant.id,
            variantIndex,
            adjustmentType: 'PERCENTAGE',
            adjustmentValue: -8,
            validFromOffsetDays: -2,
            validToOffsetDays: 14,
            conditionType: 'ZDISC',
          });
        } else {
          pushRelativeRow({
            variantId: variant.id,
            variantIndex,
            adjustmentType: 'FIXED_AMOUNT',
            adjustmentValue: -5,
            minQuantity: 5,
            maxQuantity: 25,
            validFromOffsetDays: -1,
            validToOffsetDays: 10,
            conditionType: 'ZPROMO',
          });
        }
        break;
      case 'CUSTOMER_MIXED':
        if (variantIndex % 2 === 0) {
          pushFixedRow({
            variantId: variant.id,
            variantIndex,
            conditionType: 'PR00',
          });
        } else {
          pushRelativeRow({
            variantId: variant.id,
            variantIndex,
            adjustmentType: variantIndex % 4 === 1 ? 'FIXED_AMOUNT' : 'PERCENTAGE',
            adjustmentValue: variantIndex % 4 === 1 ? -7.5 : -12,
            conditionType: 'ZCUST',
          });
        }
        if (variantIndex === 0) {
          pushFixedRow({
            variantId: variant.id,
            variantIndex,
            minQuantity: 10,
            maxQuantity: 99,
            conditionType: 'ZTIER',
            priceShift: -3,
          });
        }
        break;
      case 'CUSTOMER_FIXED':
        pushFixedRow({
          variantId: variant.id,
          variantIndex,
          conditionType: 'PR00',
          validFromOffsetDays: -1,
          validToOffsetDays: 21,
        });
        if (variantIndex === 1) {
          pushRelativeRow({
            variantId: variant.id,
            variantIndex,
            adjustmentType: 'FIXED_AMOUNT',
            adjustmentValue: -4,
            minQuantity: 10,
            maxQuantity: 49,
            conditionType: 'ZCUSTOMER',
            validFromOffsetDays: -1,
            validToOffsetDays: 21,
          });
        }
        break;
      case 'DRAFT_SALE':
        if (variantIndex % 2 === 0) {
          pushRelativeRow({
            variantId: variant.id,
            variantIndex,
            adjustmentType: 'PERCENTAGE',
            adjustmentValue: -6,
            validFromOffsetDays: 7,
            validToOffsetDays: 30,
            conditionType: 'ZFUTURE',
          });
        } else {
          pushFixedRow({
            variantId: variant.id,
            variantIndex,
            validFromOffsetDays: 7,
            validToOffsetDays: 30,
            conditionType: 'PR00',
          });
        }
        break;
      case 'ARCHIVED_FIXED':
        pushFixedRow({
          variantId: variant.id,
          variantIndex,
          validFromOffsetDays: -120,
          validToOffsetDays: -30,
          conditionType: 'ARCHIVE',
        });
        break;
      case 'CONTRACT_EXCHANGE':
        if (variantIndex % 2 === 0) {
          pushFixedRow({
            variantId: variant.id,
            variantIndex,
            validFromOffsetDays: -1,
            validToOffsetDays: 20,
            conditionType: 'ZCON',
            sourceAppliedExchangeRate: 0.79,
          });
        } else {
          pushRelativeRow({
            variantId: variant.id,
            variantIndex,
            adjustmentType: variantIndex % 4 === 1 ? 'PERCENTAGE' : 'FIXED_AMOUNT',
            adjustmentValue: variantIndex % 4 === 1 ? -4 : -3,
            minQuantity: variantIndex === 1 ? 10 : 1,
            maxQuantity: variantIndex === 1 ? 49 : null,
            validFromOffsetDays: -1,
            validToOffsetDays: 18,
            conditionType: 'ZCONDISC',
          });
        }
        break;
      case 'CONTRACT_DRAFT':
        if (variantIndex % 2 === 0) {
          pushRelativeRow({
            variantId: variant.id,
            variantIndex,
            adjustmentType: 'PERCENTAGE',
            adjustmentValue: -5,
            validFromOffsetDays: 10,
            validToOffsetDays: 55,
            conditionType: 'ZDRAFT',
          });
        } else {
          pushFixedRow({
            variantId: variant.id,
            variantIndex,
            validFromOffsetDays: 10,
            validToOffsetDays: 55,
            conditionType: 'ZCON',
          });
        }
        break;
    }
  }

  return rows;
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectExecution) {
  runPricingSeed()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
