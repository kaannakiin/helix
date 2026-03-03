import type { ExportColumnDef } from '@org/types/export';

export const PRICE_LIST_EXPORT_COLUMNS: ExportColumnDef[] = [
  { field: 'name', headerKey: 'frontend.admin.priceLists.table.name', type: 'text', width: 25 },
  { field: 'type', headerKey: 'frontend.admin.priceLists.table.type', type: 'text', width: 12 },
  { field: 'status', headerKey: 'frontend.admin.priceLists.table.status', type: 'text', width: 12 },
  { field: 'currencyCode', headerKey: 'frontend.admin.priceLists.table.currencyCode', type: 'text', width: 10 },
  { field: 'isActive', headerKey: 'frontend.admin.priceLists.table.isActive', type: 'boolean', width: 10 },
  { field: 'priority', headerKey: 'frontend.admin.priceLists.table.priority', type: 'number', width: 10 },
  { field: 'validFrom', headerKey: 'frontend.admin.priceLists.table.validFrom', type: 'datetime', width: 22 },
  { field: 'validTo', headerKey: 'frontend.admin.priceLists.table.validTo', type: 'datetime', width: 22 },
  { field: '_count.prices', headerKey: 'frontend.admin.priceLists.table.pricesCount', type: 'number', width: 12 },
  { field: 'createdAt', headerKey: 'frontend.admin.priceLists.table.createdAt', type: 'datetime', width: 22 },
];
