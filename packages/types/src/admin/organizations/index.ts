import type { Prisma } from '@org/prisma/browser';
import type { FieldFilterConfig } from '@org/types/data-query';

export const ADMIN_ORGANIZATIONS_FIELD_CONFIG = {
  name: { filterType: 'text' },
  taxId: { filterType: 'text' },
  email: { filterType: 'text' },
  phone: { filterType: 'text' },
  isActive: { filterType: 'boolean' },
  createdAt: { filterType: 'date' },
} as const satisfies Record<string, FieldFilterConfig>;

export type AdminOrganizationsFilterableField =
  keyof typeof ADMIN_ORGANIZATIONS_FIELD_CONFIG;

export const ADMIN_ORGANIZATIONS_SORT_FIELDS = [
  'name',
  'taxId',
  'email',
  'phone',
  'isActive',
  'createdAt',
] as const;
export type AdminOrganizationsSortField =
  (typeof ADMIN_ORGANIZATIONS_SORT_FIELDS)[number];

export const AdminOrganizationsPrismaQuery = {
  _count: { select: { members: true, childOrgs: true } },
  parentOrg: { select: { id: true, name: true } },
} as const satisfies Prisma.OrganizationInclude;

export type AdminOrganizationsPrismaType = Prisma.OrganizationGetPayload<{
  include: typeof AdminOrganizationsPrismaQuery;
}>;

export const AdminOrganizationDetailPrismaQuery = {
  _count: { select: { members: true, childOrgs: true } },
  parentOrg: { select: { id: true, name: true } },
  childOrgs: { select: { id: true, name: true, isActive: true } },
  members: {
    include: {
      customer: {
        select: { id: true, name: true, surname: true, email: true },
      },
    },
    orderBy: { role: 'asc' as const },
  },
} as const satisfies Prisma.OrganizationInclude;

export type AdminOrganizationDetailPrismaType = Prisma.OrganizationGetPayload<{
  include: typeof AdminOrganizationDetailPrismaQuery;
}>;
