import type { ExportColumnDef } from '@org/types/export';

export const CUSTOMER_EXPORT_COLUMNS: ExportColumnDef[] = [
  { field: 'name', headerKey: 'frontend.admin.customers.table.name', type: 'text', width: 20 },
  { field: 'surname', headerKey: 'frontend.admin.customers.table.surname', type: 'text', width: 20 },
  { field: 'email', headerKey: 'frontend.admin.customers.table.email', type: 'text', width: 30 },
  { field: 'phone', headerKey: 'frontend.admin.customers.table.phone', type: 'text', width: 20 },
  {
    field: 'role',
    headerKey: 'frontend.admin.customers.table.role',
    type: 'badge',
    width: 15,
    labelMap: { ADMIN: 'Admin', MODERATOR: 'Moderator', USER: 'User' },
  },
  {
    field: 'status',
    headerKey: 'frontend.admin.customers.table.status',
    type: 'badge',
    width: 15,
    labelMap: {
      ACTIVE: 'Active',
      SUSPENDED: 'Suspended',
      BANNED: 'Banned',
      DEACTIVATED: 'Deactivated',
    },
  },
  { field: 'emailVerified', headerKey: 'frontend.admin.customers.table.emailVerified', type: 'boolean', width: 15 },
  { field: 'phoneVerified', headerKey: 'frontend.admin.customers.table.phoneVerified', type: 'boolean', width: 15 },
  { field: 'twoFactorEnabled', headerKey: 'frontend.admin.customers.table.twoFactorEnabled', type: 'boolean', width: 12 },
  { field: 'lastLoginAt', headerKey: 'frontend.admin.customers.table.lastLoginAt', type: 'datetime', width: 22 },
  { field: 'loginCount', headerKey: 'frontend.admin.customers.table.loginCount', type: 'number', width: 12 },
  { field: 'createdAt', headerKey: 'frontend.admin.customers.table.createdAt', type: 'datetime', width: 22 },
];
