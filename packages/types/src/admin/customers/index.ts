import type { Prisma } from '@org/prisma/browser';
import type { FieldFilterConfig } from '@org/types/data-query';

export const ADMIN_CUSTOMERS_FIELD_CONFIG = {
  name: { filterType: 'text' },
  surname: { filterType: 'text' },
  email: { filterType: 'text' },
  phone: { filterType: 'text' },
  accountType: { filterType: 'enum', values: ['PERSONAL', 'BUSINESS'] },
  status: {
    filterType: 'enum',
    values: ['ACTIVE', 'SUSPENDED', 'BANNED', 'DEACTIVATED'],
  },
  emailVerified: { filterType: 'boolean' },
  phoneVerified: { filterType: 'boolean' },
  twoFactorEnabled: { filterType: 'boolean' },
  createdAt: { filterType: 'date' },
  lastLoginAt: { filterType: 'date' },
  loginCount: { filterType: 'number' },
  storeId: { filterType: 'enum' },
} as const satisfies Record<string, FieldFilterConfig>;

export type AdminCustomersFilterableField =
  keyof typeof ADMIN_CUSTOMERS_FIELD_CONFIG;

export const ADMIN_CUSTOMERS_SORT_FIELDS = [
  'name',
  'surname',
  'email',
  'phone',
  'accountType',
  'status',
  'emailVerified',
  'phoneVerified',
  'twoFactorEnabled',
  'createdAt',
  'lastLoginAt',
  'loginCount',
] as const;
export type AdminCustomersSortField =
  (typeof ADMIN_CUSTOMERS_SORT_FIELDS)[number];

export const AdminCustomersPrismaQuery = {
  store: { select: { id: true, name: true } },
} as const satisfies Prisma.CustomerInclude;

export type AdminCustomersPrismaType = Prisma.CustomerGetPayload<{
  include: typeof AdminCustomersPrismaQuery;
}>;

export const AdminCustomerDetailPrismaQuery = {
  _count: {
    select: { sessions: true, devices: true },
  },
} as const satisfies Prisma.CustomerInclude;

export type AdminCustomerDetailPrismaType = Prisma.CustomerGetPayload<{
  include: typeof AdminCustomerDetailPrismaQuery;
}>;
