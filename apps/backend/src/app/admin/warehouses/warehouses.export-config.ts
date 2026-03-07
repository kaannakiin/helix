import type { ExportColumnDef } from '@org/types/export';

export const WAREHOUSE_EXPORT_COLUMNS: ExportColumnDef[] = [
  { field: 'code', headerKey: 'frontend.admin.warehouses.table.code', type: 'text', width: 15 },
  { field: 'translations[0].name', headerKey: 'frontend.admin.warehouses.table.name', type: 'text', width: 25 },
  { field: 'status', headerKey: 'frontend.admin.warehouses.table.status', type: 'text', width: 15 },
  { field: 'country.translations[0].name', headerKey: 'frontend.admin.warehouses.table.country', type: 'text', width: 20 },
  { field: 'state.name', headerKey: 'frontend.admin.warehouses.table.state', type: 'text', width: 20 },
  { field: 'city.name', headerKey: 'frontend.admin.warehouses.table.city', type: 'text', width: 20 },
  { field: 'createdAt', headerKey: 'frontend.admin.warehouses.table.createdAt', type: 'datetime', width: 22 },
];
