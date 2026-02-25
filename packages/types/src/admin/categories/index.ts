import type { Prisma } from '@org/prisma/browser';
import type { FieldFilterConfig } from '../../data-query/index.js';

export const ADMIN_CATEGORIES_FIELD_CONFIG = {
  slug: { filterType: 'text' },
  isActive: { filterType: 'boolean' },
  depth: { filterType: 'number' },
  createdAt: { filterType: 'date' },
  updatedAt: { filterType: 'date' },
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
] as const;

export type AdminCategoriesSortField =
  (typeof ADMIN_CATEGORIES_SORT_FIELDS)[number];

export const AdminCategoryListPrismaQuery = {
  translations: true,
  images: { where: { isPrimary: true }, take: 1 },
  parent: { include: { translations: true } },
  _count: { select: { children: true, products: true } },
} as const satisfies Prisma.CategoryInclude;

export type AdminCategoryListPrismaType = Prisma.CategoryGetPayload<{
  include: typeof AdminCategoryListPrismaQuery;
}>;

export const AdminCategoryDetailPrismaQuery = {
  translations: true,
  images: { orderBy: { sortOrder: 'asc' as const } },
  parent: { include: { translations: true } },
  _count: { select: { children: true, products: true } },
} as const satisfies Prisma.CategoryInclude;

export type AdminCategoryDetailPrismaType = Prisma.CategoryGetPayload<{
  include: typeof AdminCategoryDetailPrismaQuery;
}>;
