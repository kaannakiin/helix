import type { Prisma } from '@org/prisma/browser';
import type { FieldFilterConfig } from '../../data-query/index.js';

export const ADMIN_CUSTOMER_GROUPS_FIELD_CONFIG = {
  name: { filterType: 'text' },
  type: { filterType: 'text' },
  isActive: { filterType: 'boolean' },
  lastEvaluatedAt: { filterType: 'date' },
  createdAt: { filterType: 'date' },
  updatedAt: { filterType: 'date' },
  '_count.members': { filterType: 'number' },
  storeId: { filterType: 'text' },
} as const satisfies Record<string, FieldFilterConfig>;

export type AdminCustomerGroupsFilterableField =
  keyof typeof ADMIN_CUSTOMER_GROUPS_FIELD_CONFIG;

export const ADMIN_CUSTOMER_GROUPS_SORT_FIELDS = [
  'name',
  'type',
  'isActive',
  'lastEvaluatedAt',
  'createdAt',
  'updatedAt',
  '_count.members',
] as const;

export type AdminCustomerGroupsSortField =
  (typeof ADMIN_CUSTOMER_GROUPS_SORT_FIELDS)[number];

export const AdminCustomerGroupListPrismaQuery = {
  _count: { select: { members: true } },
  store: { select: { id: true, name: true } },
} as const satisfies Prisma.CustomerGroupInclude;

export type AdminCustomerGroupListPrismaType = Prisma.CustomerGroupGetPayload<{
  include: typeof AdminCustomerGroupListPrismaQuery;
}>;

export const AdminCustomerGroupDetailPrismaQuery = {
  ruleTree: true,
  _count: { select: { members: true } },
} as const satisfies Prisma.CustomerGroupInclude;

export type AdminCustomerGroupDetailPrismaType =
  Prisma.CustomerGroupGetPayload<{
    include: typeof AdminCustomerGroupDetailPrismaQuery;
  }>;
