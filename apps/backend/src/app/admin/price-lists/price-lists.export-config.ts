import type { ExportColumnDef } from '@org/types/export';

export const PRICE_LIST_EXPORT_COLUMNS: ExportColumnDef[] = [
  { field: 'name', headerKey: 'common.admin.priceLists.table.name', type: 'text', width: 25 },
  { field: 'type', headerKey: 'common.admin.priceLists.table.type', type: 'text', width: 12 },
  { field: 'status', headerKey: 'common.admin.priceLists.table.status', type: 'text', width: 12 },
  { field: 'currencyCode', headerKey: 'common.admin.priceLists.table.currencyCode', type: 'text', width: 10 },
  { field: 'isActive', headerKey: 'common.admin.priceLists.table.isActive', type: 'boolean', width: 10 },
  { field: 'priority', headerKey: 'common.admin.priceLists.table.priority', type: 'number', width: 10 },
  { field: 'validFrom', headerKey: 'common.admin.priceLists.table.validFrom', type: 'datetime', width: 22 },
  { field: 'validTo', headerKey: 'common.admin.priceLists.table.validTo', type: 'datetime', width: 22 },
  { field: '_count.prices', headerKey: 'common.admin.priceLists.table.pricesCount', type: 'number', width: 12 },
  { field: 'createdAt', headerKey: 'common.admin.priceLists.table.createdAt', type: 'datetime', width: 22 },
];
