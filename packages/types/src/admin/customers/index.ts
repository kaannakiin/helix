import type { Prisma } from '@org/prisma/browser';
import type { FieldFilterConfig } from '@org/types/data-query';

export const ADMIN_CUSTOMERS_FIELD_CONFIG = {
  name: { filterType: 'text' },
  surname: { filterType: 'text' },
  email: { filterType: 'text' },
  phone: { filterType: 'text' },
  role: { filterType: 'enum', values: ['USER', 'ADMIN', 'MODERATOR'] },
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
} as const satisfies Record<string, FieldFilterConfig>;

export type AdminCustomersFilterableField =
  keyof typeof ADMIN_CUSTOMERS_FIELD_CONFIG;

export const ADMIN_CUSTOMERS_SORT_FIELDS = [
  'name',
  'surname',
  'email',
  'phone',
  'role',
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

export const AdminCustomersPrismaQuery =
  {} as const satisfies Prisma.UserInclude;

export type AdminCustomersPrismaType = Prisma.UserGetPayload<{
  include: typeof AdminCustomersPrismaQuery;
}>;

export const AdminCustomerDetailPrismaQuery = {
  _count: {
    select: { sessions: true, devices: true, loginHistory: true },
  },
} as const satisfies Prisma.UserInclude;

export type AdminCustomerDetailPrismaType = Prisma.UserGetPayload<{
  include: typeof AdminCustomerDetailPrismaQuery;
}>;
