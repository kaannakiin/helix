import type { Prisma } from '@org/prisma/browser';
import type { FieldFilterConfig } from '../../data-query/index.js';

export const ADMIN_TAG_GROUPS_FIELD_CONFIG = {
  slug: { filterType: 'text' },
  isActive: { filterType: 'boolean' },
  createdAt: { filterType: 'date' },
  updatedAt: { filterType: 'date' },
} as const satisfies Record<string, FieldFilterConfig>;

export type AdminTagGroupsFilterableField =
  keyof typeof ADMIN_TAG_GROUPS_FIELD_CONFIG;

export const ADMIN_TAG_GROUPS_SORT_FIELDS = [
  'slug',
  'isActive',
  'sortOrder',
  'createdAt',
  'updatedAt',
] as const;

export type AdminTagGroupsSortField =
  (typeof ADMIN_TAG_GROUPS_SORT_FIELDS)[number];

export const AdminTagGroupListPrismaQuery = {
  translations: true,
  _count: { select: { tags: true } },
} as const satisfies Prisma.TagGroupInclude;

export type AdminTagGroupListPrismaType = Prisma.TagGroupGetPayload<{
  include: typeof AdminTagGroupListPrismaQuery;
}>;

export const AdminTagGroupDetailPrismaQuery = {
  translations: true,
  tags: {
    include: {
      translations: true,
      images: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: { sortOrder: 'asc' as const },
  },
} as const satisfies Prisma.TagGroupInclude;

export type AdminTagGroupDetailPrismaType = Prisma.TagGroupGetPayload<{
  include: typeof AdminTagGroupDetailPrismaQuery;
}>;

export const ADMIN_TAGS_FIELD_CONFIG = {
  slug: { filterType: 'text' },
  isActive: { filterType: 'boolean' },
  createdAt: { filterType: 'date' },
  updatedAt: { filterType: 'date' },
} as const satisfies Record<string, FieldFilterConfig>;

export type AdminTagsFilterableField = keyof typeof ADMIN_TAGS_FIELD_CONFIG;

export const ADMIN_TAGS_SORT_FIELDS = [
  'slug',
  'isActive',
  'sortOrder',
  'createdAt',
  'updatedAt',
] as const;

export type AdminTagsSortField = (typeof ADMIN_TAGS_SORT_FIELDS)[number];
