import type { Locale, Prisma } from '@org/prisma/browser';
import type { FieldFilterConfig } from '../../data-query/index.js';

export const ADMIN_PRODUCTS_FIELD_CONFIG = {
  type: { filterType: 'enum', values: ['PHYSICAL', 'DIGITAL'] },
  status: { filterType: 'enum', values: ['DRAFT', 'ACTIVE', 'ARCHIVED'] },
  createdAt: { filterType: 'date' },
  updatedAt: { filterType: 'date' },
  '_count.variants': { filterType: 'number' },
  '_count.categories': { filterType: 'number' },
  '_count.tags': { filterType: 'number' },
} as const satisfies Record<string, FieldFilterConfig>;

export type AdminProductsFilterableField =
  keyof typeof ADMIN_PRODUCTS_FIELD_CONFIG;

export const ADMIN_PRODUCTS_SORT_FIELDS = [
  'type',
  'status',
  'sortOrder',
  'createdAt',
  'updatedAt',
  '_count.variants',
  '_count.categories',
  '_count.tags',
] as const;

export type AdminProductsSortField =
  (typeof ADMIN_PRODUCTS_SORT_FIELDS)[number];

export const adminProductListPrismaQuery = (locale: Locale) =>
  ({
    translations: { where: { locale } },
    images: { where: { isPrimary: true }, take: 1 },
    brand: { include: { translations: { where: { locale } } } },
    _count: { select: { variants: true, categories: true, tags: true } },
  }) satisfies Prisma.ProductInclude;

export type AdminProductListPrismaType = Prisma.ProductGetPayload<{
  include: ReturnType<typeof adminProductListPrismaQuery>;
}>;

export const adminProductDetailPrismaQuery = (locale: Locale) =>
  ({
    translations: { where: { locale } },
    images: { orderBy: { sortOrder: 'asc' as const } },
    brand: { include: { translations: { where: { locale } } } },
    variantGroups: {
      include: {
        variantGroup: {
          include: {
            translations: { where: { locale } },
            options: {
              include: {
                translations: { where: { locale } },
                images: { orderBy: { sortOrder: 'asc' as const } },
              },
              orderBy: { sortOrder: 'asc' as const },
            },
          },
        },
        options: {
          include: {
            images: { orderBy: { sortOrder: 'asc' as const } },
          },
          orderBy: { sortOrder: 'asc' as const },
        },
      },
      orderBy: { sortOrder: 'asc' as const },
    },
    variants: {
      include: {
        optionValues: {
          include: { variantOption: { include: { translations: { where: { locale } } } } },
        },
        images: true,
      },
      orderBy: { sortOrder: 'asc' as const },
    },
    categories: {
      include: { category: { include: { translations: { where: { locale } } } } },
    },
    tags: {
      include: { tag: { include: { translations: { where: { locale } } } } },
    },
  }) satisfies Prisma.ProductInclude;

export type AdminProductDetailPrismaType = Prisma.ProductGetPayload<{
  include: ReturnType<typeof adminProductDetailPrismaQuery>;
}>;
