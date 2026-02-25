import type { Prisma } from '@org/prisma/browser';
import type { FieldFilterConfig } from '../../data-query/index.js';

export const ADMIN_VARIANT_GROUPS_FIELD_CONFIG = {
  createdAt: { filterType: 'date' },
  updatedAt: { filterType: 'date' },
} as const satisfies Record<string, FieldFilterConfig>;

export type AdminVariantGroupsFilterableField =
  keyof typeof ADMIN_VARIANT_GROUPS_FIELD_CONFIG;

export const ADMIN_VARIANT_GROUPS_SORT_FIELDS = [
  'sortOrder',
  'createdAt',
  'updatedAt',
] as const;

export type AdminVariantGroupsSortField =
  (typeof ADMIN_VARIANT_GROUPS_SORT_FIELDS)[number];

export const AdminVariantGroupListPrismaQuery = {
  translations: true,
  _count: { select: { options: true, products: true } },
} as const satisfies Prisma.VariantGroupInclude;

export type AdminVariantGroupListPrismaType = Prisma.VariantGroupGetPayload<{
  include: typeof AdminVariantGroupListPrismaQuery;
}>;

export const AdminVariantGroupDetailPrismaQuery = {
  translations: true,
  options: {
    include: {
      translations: true,
      images: { orderBy: { sortOrder: 'asc' as const } },
    },
    orderBy: { sortOrder: 'asc' as const },
  },
  _count: { select: { products: true } },
} as const satisfies Prisma.VariantGroupInclude;

export type AdminVariantGroupDetailPrismaType = Prisma.VariantGroupGetPayload<{
  include: typeof AdminVariantGroupDetailPrismaQuery;
}>;
