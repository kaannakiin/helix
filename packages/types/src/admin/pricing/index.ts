import type { Prisma } from '@org/prisma/browser';
import type { FieldFilterConfig } from '../../data-query/index.js';

export const ADMIN_PRICE_LISTS_FIELD_CONFIG = {
  name: { filterType: 'text' },
  type: { filterType: 'enum', values: ['BASE', 'SALE', 'CUSTOM'] },
  status: { filterType: 'enum', values: ['ACTIVE', 'DRAFT', 'ARCHIVED'] },
  currencyCode: { filterType: 'enum', values: ['TRY', 'USD', 'EUR', 'GBP'] },
  isActive: { filterType: 'boolean' },
  priority: { filterType: 'number' },
  validFrom: { filterType: 'date' },
  validTo: { filterType: 'date' },
  createdAt: { filterType: 'date' },
} as const satisfies Record<string, FieldFilterConfig>;

export type AdminPriceListsFilterableField =
  keyof typeof ADMIN_PRICE_LISTS_FIELD_CONFIG;

export const ADMIN_PRICE_LISTS_SORT_FIELDS = [
  'name',
  'type',
  'status',
  'currencyCode',
  'isActive',
  'priority',
  'validFrom',
  'validTo',
  'createdAt',
] as const;

export type AdminPriceListsSortField =
  (typeof ADMIN_PRICE_LISTS_SORT_FIELDS)[number];

export const AdminPriceListListPrismaQuery = {
  _count: { select: { prices: true } },
} as const satisfies Prisma.PriceListInclude;

export type AdminPriceListListPrismaType = Prisma.PriceListGetPayload<{
  include: typeof AdminPriceListListPrismaQuery;
}>;

export const AdminPriceListDetailPrismaQuery = {
  prices: true,
  parentPriceList: true,
  customerGroupLinks: { include: { customerGroup: true } },
} as const satisfies Prisma.PriceListInclude;

export type AdminPriceListDetailPrismaType = Prisma.PriceListGetPayload<{
  include: typeof AdminPriceListDetailPrismaQuery;
}>;
