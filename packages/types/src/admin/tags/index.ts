import type { Locale, Prisma } from '@org/prisma/browser';
import type { FieldFilterConfig } from '../../data-query/index.js';

export const ADMIN_TAG_GROUPS_FIELD_CONFIG = {
  slug: { filterType: 'text' },
  isActive: { filterType: 'boolean' },
  createdAt: { filterType: 'date' },
  updatedAt: { filterType: 'date' },
  '_count.tags': { filterType: 'number' },
} as const satisfies Record<string, FieldFilterConfig>;

export type AdminTagGroupsFilterableField =
  keyof typeof ADMIN_TAG_GROUPS_FIELD_CONFIG;

export const ADMIN_TAG_GROUPS_SORT_FIELDS = [
  'slug',
  'isActive',
  'sortOrder',
  'createdAt',
  'updatedAt',
  '_count.tags',
] as const;

export type AdminTagGroupsSortField =
  (typeof ADMIN_TAG_GROUPS_SORT_FIELDS)[number];

export const adminTagGroupListPrismaQuery = (locale: Locale) =>
  ({
    translations: { where: { locale } },
    _count: { select: { tags: true } },
  }) satisfies Prisma.TagGroupInclude;

export type AdminTagGroupListPrismaType = Prisma.TagGroupGetPayload<{
  include: ReturnType<typeof adminTagGroupListPrismaQuery>;
}>;

export const adminTagGroupDetailPrismaQuery = (locale: Locale) =>
  ({
    translations: { where: { locale } },
  }) satisfies Prisma.TagGroupInclude;

export type AdminTagGroupDetailPrismaType = Prisma.TagGroupGetPayload<{
  include: ReturnType<typeof adminTagGroupDetailPrismaQuery>;
}>;

export const adminTagChildrenPrismaQuery = (locale: Locale) =>
  ({
    translations: { where: { locale } },
    images: { where: { isPrimary: true }, take: 1 },
    _count: { select: { children: true } },
  }) satisfies Prisma.TagInclude;

export type AdminTagChildrenPrismaType = Prisma.TagGetPayload<{
  include: ReturnType<typeof adminTagChildrenPrismaQuery>;
}>;

export const ADMIN_TAGS_FIELD_CONFIG = {
  slug: { filterType: 'text' },
  isActive: { filterType: 'boolean' },
  depth: { filterType: 'number' },
  createdAt: { filterType: 'date' },
  updatedAt: { filterType: 'date' },
} as const satisfies Record<string, FieldFilterConfig>;

export type AdminTagsFilterableField = keyof typeof ADMIN_TAGS_FIELD_CONFIG;

export const ADMIN_TAGS_SORT_FIELDS = [
  'slug',
  'isActive',
  'depth',
  'sortOrder',
  'createdAt',
  'updatedAt',
] as const;

export type AdminTagsSortField = (typeof ADMIN_TAGS_SORT_FIELDS)[number];
