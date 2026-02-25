import type { Prisma } from '@org/prisma/browser';
import type { FieldFilterConfig } from '../../data-query/index.js';

export const ADMIN_PRODUCTS_FIELD_CONFIG = {
  type: { filterType: 'enum', values: ['PHYSICAL', 'DIGITAL'] },
  status: { filterType: 'enum', values: ['DRAFT', 'ACTIVE', 'ARCHIVED'] },
  createdAt: { filterType: 'date' },
  updatedAt: { filterType: 'date' },
} as const satisfies Record<string, FieldFilterConfig>;

export type AdminProductsFilterableField =
  keyof typeof ADMIN_PRODUCTS_FIELD_CONFIG;

export const ADMIN_PRODUCTS_SORT_FIELDS = [
  'type',
  'status',
  'sortOrder',
  'createdAt',
  'updatedAt',
] as const;

export type AdminProductsSortField =
  (typeof ADMIN_PRODUCTS_SORT_FIELDS)[number];

export const AdminProductListPrismaQuery = {
  translations: true,
  images: { where: { isPrimary: true }, take: 1 },
  brand: { include: { translations: true } },
  _count: { select: { variants: true, categories: true, tags: true } },
} as const satisfies Prisma.ProductInclude;

export type AdminProductListPrismaType = Prisma.ProductGetPayload<{
  include: typeof AdminProductListPrismaQuery;
}>;

export const AdminProductDetailPrismaQuery = {
  translations: true,
  images: { orderBy: { sortOrder: 'asc' as const } },
  brand: { include: { translations: true } },
  variantGroups: {
    include: {
      variantGroup: {
        include: {
          translations: true,
          options: {
            include: {
              translations: true,
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
        include: { variantOption: { include: { translations: true } } },
      },
      images: true,
    },
    orderBy: { sortOrder: 'asc' as const },
  },
  categories: {
    include: { category: { include: { translations: true } } },
  },
  tags: {
    include: { tag: { include: { translations: true } } },
  },
} as const satisfies Prisma.ProductInclude;

export type AdminProductDetailPrismaType = Prisma.ProductGetPayload<{
  include: typeof AdminProductDetailPrismaQuery;
}>;
