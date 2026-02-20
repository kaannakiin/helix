import type { ExportColumnDef } from '@org/types/export';

export const CUSTOMER_EXPORT_COLUMNS: ExportColumnDef[] = [
  { field: 'name', headerKey: 'common.admin.customers.table.name', type: 'text', width: 20 },
  { field: 'surname', headerKey: 'common.admin.customers.table.surname', type: 'text', width: 20 },
  { field: 'email', headerKey: 'common.admin.customers.table.email', type: 'text', width: 30 },
  { field: 'phone', headerKey: 'common.admin.customers.table.phone', type: 'text', width: 20 },
  {
    field: 'role',
    headerKey: 'common.admin.customers.table.role',
    type: 'badge',
    width: 15,
    labelMap: { ADMIN: 'Admin', MODERATOR: 'Moderator', USER: 'User' },
  },
  {
    field: 'status',
    headerKey: 'common.admin.customers.table.status',
    type: 'badge',
    width: 15,
    labelMap: {
      ACTIVE: 'Active',
      SUSPENDED: 'Suspended',
      BANNED: 'Banned',
      DEACTIVATED: 'Deactivated',
    },
  },
  { field: 'emailVerified', headerKey: 'common.admin.customers.table.emailVerified', type: 'boolean', width: 15 },
  { field: 'phoneVerified', headerKey: 'common.admin.customers.table.phoneVerified', type: 'boolean', width: 15 },
  { field: 'twoFactorEnabled', headerKey: 'common.admin.customers.table.twoFactorEnabled', type: 'boolean', width: 12 },
  { field: 'lastLoginAt', headerKey: 'common.admin.customers.table.lastLoginAt', type: 'datetime', width: 22 },
  { field: 'loginCount', headerKey: 'common.admin.customers.table.loginCount', type: 'number', width: 12 },
  { field: 'createdAt', headerKey: 'common.admin.customers.table.createdAt', type: 'datetime', width: 22 },
];
