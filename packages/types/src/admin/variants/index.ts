import type { Locale, Prisma } from '@org/prisma/browser';
import type { FieldFilterConfig } from '../../data-query/index.js';

export const ADMIN_VARIANT_GROUPS_FIELD_CONFIG = {
  createdAt: { filterType: 'date' },
  updatedAt: { filterType: 'date' },
  '_count.options': { filterType: 'number' },
  '_count.products': { filterType: 'number' },
} as const satisfies Record<string, FieldFilterConfig>;

export type AdminVariantGroupsFilterableField =
  keyof typeof ADMIN_VARIANT_GROUPS_FIELD_CONFIG;

export const ADMIN_VARIANT_GROUPS_SORT_FIELDS = [
  'sortOrder',
  'createdAt',
  'updatedAt',
  '_count.options',
  '_count.products',
] as const;

export type AdminVariantGroupsSortField =
  (typeof ADMIN_VARIANT_GROUPS_SORT_FIELDS)[number];

export const adminVariantGroupListPrismaQuery = (locale: Locale) =>
  ({
    translations: { where: { locale } },
    _count: { select: { options: true, products: true } },
  }) satisfies Prisma.VariantGroupInclude;

export type AdminVariantGroupListPrismaType = Prisma.VariantGroupGetPayload<{
  include: ReturnType<typeof adminVariantGroupListPrismaQuery>;
}>;

export const adminVariantGroupDetailPrismaQuery = (locale: Locale) =>
  ({
    translations: { where: { locale } },
    options: {
      include: {
        translations: { where: { locale } },
        images: { orderBy: { sortOrder: 'asc' as const } },
      },
      orderBy: { sortOrder: 'asc' as const },
    },
    _count: { select: { products: true } },
  }) satisfies Prisma.VariantGroupInclude;

export type AdminVariantGroupDetailPrismaType = Prisma.VariantGroupGetPayload<{
  include: ReturnType<typeof adminVariantGroupDetailPrismaQuery>;
}>;
