import type { ExportColumnDef } from '@org/types/export';

export const ORGANIZATION_EXPORT_COLUMNS: ExportColumnDef[] = [
  { field: 'name', headerKey: 'frontend.admin.organizations.table.name', type: 'text', width: 25 },
  { field: 'taxId', headerKey: 'frontend.admin.organizations.table.taxId', type: 'text', width: 15 },
  { field: 'email', headerKey: 'frontend.admin.organizations.table.email', type: 'text', width: 25 },
  { field: 'phone', headerKey: 'frontend.admin.organizations.table.phone', type: 'text', width: 15 },
  { field: 'address', headerKey: 'frontend.admin.organizations.table.address', type: 'text', width: 30 },
  { field: 'isActive', headerKey: 'frontend.admin.organizations.table.isActive', type: 'boolean', width: 10 },
  { field: 'store.name', headerKey: 'frontend.admin.organizations.table.store', type: 'text', width: 20 },
  { field: 'createdAt', headerKey: 'frontend.admin.organizations.table.createdAt', type: 'datetime', width: 22 },
];
