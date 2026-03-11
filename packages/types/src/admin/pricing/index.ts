import type { Prisma } from '@org/prisma/browser';
import type { FieldFilterConfig } from '../../data-query/index.js';

export const ADMIN_PRICE_LISTS_FIELD_CONFIG = {
  name: { filterType: 'text' },
  type: { filterType: 'enum', values: ['BASE', 'SALE', 'CUSTOM', 'CONTRACT'] },
  status: { filterType: 'enum', values: ['ACTIVE', 'DRAFT', 'ARCHIVED'] },
  defaultCurrencyCode: { filterType: 'enum', values: ['TRY', 'USD', 'EUR', 'GBP'] },
  isActive: { filterType: 'boolean' },
  priority: { filterType: 'number' },
  validFrom: { filterType: 'date' },
  validTo: { filterType: 'date' },
  createdAt: { filterType: 'date' },
  sourceSystem: { filterType: 'text' },
  isSourceLocked: { filterType: 'boolean' },
  contractRef: { filterType: 'text' },
  isExchangeRateDerived: { filterType: 'boolean' },
  sourceCurrencyCode: { filterType: 'enum', values: ['TRY', 'USD', 'EUR', 'GBP'] },
  roundingRule: { filterType: 'text' },
} as const satisfies Record<string, FieldFilterConfig>;

export type AdminPriceListsFilterableField =
  keyof typeof ADMIN_PRICE_LISTS_FIELD_CONFIG;

export const ADMIN_PRICE_LISTS_SORT_FIELDS = [
  'name',
  'type',
  'status',
  'defaultCurrencyCode',
  'isActive',
  'priority',
  'validFrom',
  'validTo',
  'createdAt',
  'sourceSystem',
  'contractRef',
] as const;

export type AdminPriceListsSortField =
  (typeof ADMIN_PRICE_LISTS_SORT_FIELDS)[number];

export const AdminPriceListListPrismaQuery = {
  _count: { select: { prices: true, assignments: true } },
  store: { select: { id: true, name: true } },
} as const satisfies Prisma.PriceListInclude;

export type AdminPriceListListPrismaType = Prisma.PriceListGetPayload<{
  include: typeof AdminPriceListListPrismaQuery;
}>;

export const AdminPriceListDetailPrismaQuery = {
  prices: true,
  parentPriceList: true,
  assignments: {
    include: {
      customerGroup: true,
      organization: true,
      customer: true,
    },
  },
} as const satisfies Prisma.PriceListInclude;

export type AdminPriceListDetailPrismaType = Prisma.PriceListGetPayload<{
  include: typeof AdminPriceListDetailPrismaQuery;
}>;

// ── Price List Prices ──

export const ADMIN_PRICE_LIST_PRICES_FIELD_CONFIG = {
  'productVariant.sku': { filterType: 'text' },
  currencyCode: {
    filterType: 'enum',
    values: ['TRY', 'USD', 'EUR', 'GBP'],
  },
  originType: { filterType: 'enum', values: ['FIXED', 'RELATIVE'] },
  isSourceLocked: { filterType: 'boolean' },
  price: { filterType: 'number' },
  minQuantity: { filterType: 'number' },
  validFrom: { filterType: 'date' },
  validTo: { filterType: 'date' },
  updatedAt: { filterType: 'date' },
} as const satisfies Record<string, FieldFilterConfig>;

export type AdminPriceListPricesFilterableField =
  keyof typeof ADMIN_PRICE_LIST_PRICES_FIELD_CONFIG;

export const ADMIN_PRICE_LIST_PRICES_SORT_FIELDS = [
  'productVariant.sku',
  'currencyCode',
  'originType',
  'price',
  'minQuantity',
  'maxQuantity',
  'updatedAt',
  'createdAt',
] as const;

export type AdminPriceListPricesSortField =
  (typeof ADMIN_PRICE_LIST_PRICES_SORT_FIELDS)[number];

export const AdminPriceListPriceListPrismaQuery = {
  productVariant: {
    select: {
      id: true,
      sku: true,
      product: {
        select: {
          id: true,
          translations: { select: { name: true, locale: true } },
        },
      },
      optionValues: {
        select: {
          variantOption: {
            select: {
              translations: { select: { name: true, locale: true } },
            },
          },
        },
      },
    },
  },
  unitOfMeasure: { select: { id: true, code: true } },
} as const satisfies Prisma.PriceListPriceInclude;

export type AdminPriceListPriceListPrismaType =
  Prisma.PriceListPriceGetPayload<{
    include: typeof AdminPriceListPriceListPrismaQuery;
  }>;
