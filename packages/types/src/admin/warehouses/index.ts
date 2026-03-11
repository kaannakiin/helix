import type { Locale, Prisma } from '@org/prisma/browser';
import type { FieldFilterConfig } from '../../data-query/index.js';

export const ADMIN_WAREHOUSES_FIELD_CONFIG = {
  code: { filterType: 'text' },
  status: { filterType: 'enum' },
  createdAt: { filterType: 'date' },
  updatedAt: { filterType: 'date' },
  storeId: { filterType: 'text' },
} as const satisfies Record<string, FieldFilterConfig>;

export type AdminWarehousesFilterableField =
  keyof typeof ADMIN_WAREHOUSES_FIELD_CONFIG;

export const ADMIN_WAREHOUSES_SORT_FIELDS = [
  'code',
  'status',
  'sortOrder',
  'createdAt',
  'updatedAt',
] as const;

export type AdminWarehousesSortField =
  (typeof ADMIN_WAREHOUSES_SORT_FIELDS)[number];

export const adminWarehouseListPrismaQuery = (locale: Locale) =>
  ({
    translations: { where: { locale } },
    country: { include: { translations: { where: { locale } } } },
    state: true,
    city: true,
    store: { select: { id: true, name: true } },
  }) satisfies Prisma.WarehouseInclude;

export type AdminWarehouseListPrismaType = Prisma.WarehouseGetPayload<{
  include: ReturnType<typeof adminWarehouseListPrismaQuery>;
}>;
