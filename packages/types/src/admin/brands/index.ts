import type { Prisma } from '@org/prisma/browser';
import type { FieldFilterConfig } from '../../data-query/index.js';

export const ADMIN_BRANDS_FIELD_CONFIG = {
  slug: { filterType: 'text' },
  isActive: { filterType: 'boolean' },
  createdAt: { filterType: 'date' },
  updatedAt: { filterType: 'date' },
  '_count.products': { filterType: 'number' },
} as const satisfies Record<string, FieldFilterConfig>;

export type AdminBrandsFilterableField =
  keyof typeof ADMIN_BRANDS_FIELD_CONFIG;

export const ADMIN_BRANDS_SORT_FIELDS = [
  'slug',
  'isActive',
  'sortOrder',
  'createdAt',
  'updatedAt',
  '_count.products',
] as const;

export type AdminBrandsSortField =
  (typeof ADMIN_BRANDS_SORT_FIELDS)[number];

export const AdminBrandListPrismaQuery = {
  translations: true,
  images: { where: { isPrimary: true }, take: 1 },
  _count: { select: { products: true } },
} as const satisfies Prisma.BrandInclude;

export type AdminBrandListPrismaType = Prisma.BrandGetPayload<{
  include: typeof AdminBrandListPrismaQuery;
}>;

export const AdminBrandDetailPrismaQuery = {
  translations: true,
  images: true,
} as const satisfies Prisma.BrandInclude;

export type AdminBrandDetailPrismaType = Prisma.BrandGetPayload<{
  include: typeof AdminBrandDetailPrismaQuery;
}>;
