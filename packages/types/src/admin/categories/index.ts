import type { Locale, Prisma } from '@org/prisma/browser';
import type { FieldFilterConfig } from '../../data-query/index.js';

export const ADMIN_CATEGORIES_FIELD_CONFIG = {
  slug: { filterType: 'text' },
  isActive: { filterType: 'boolean' },
  depth: { filterType: 'number' },
  createdAt: { filterType: 'date' },
  updatedAt: { filterType: 'date' },
  '_count.children': { filterType: 'number' },
  '_count.products': { filterType: 'number' },
  '_count.stores': { filterType: 'number' },
} as const satisfies Record<string, FieldFilterConfig>;

export type AdminCategoriesFilterableField =
  keyof typeof ADMIN_CATEGORIES_FIELD_CONFIG;

export const ADMIN_CATEGORIES_SORT_FIELDS = [
  'slug',
  'isActive',
  'depth',
  'sortOrder',
  'createdAt',
  'updatedAt',
  '_count.children',
  '_count.products',
  '_count.stores',
] as const;

export type AdminCategoriesSortField =
  (typeof ADMIN_CATEGORIES_SORT_FIELDS)[number];

export const adminCategoryListPrismaQuery = (locale: Locale) =>
  ({
    translations: { where: { locale } },
    images: { where: { isPrimary: true }, take: 1 },
    parent: { include: { translations: { where: { locale } } } },
    _count: { select: { children: true, products: true, stores: true } },
  }) satisfies Prisma.CategoryInclude;

export type AdminCategoryListPrismaType = Prisma.CategoryGetPayload<{
  include: ReturnType<typeof adminCategoryListPrismaQuery>;
}>;

export const adminCategoryDetailPrismaQuery = (locale: Locale) =>
  ({
    translations: { where: { locale } },
    images: { orderBy: { sortOrder: 'asc' as const } },
    parent: { include: { translations: { where: { locale } } } },
    stores: true,
    _count: { select: { children: true, products: true, stores: true } },
  }) satisfies Prisma.CategoryInclude;

export type AdminCategoryDetailPrismaType = Prisma.CategoryGetPayload<{
  include: ReturnType<typeof adminCategoryDetailPrismaQuery>;
}>;
