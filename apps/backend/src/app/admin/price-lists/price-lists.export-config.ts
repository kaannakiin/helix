import type { ExportColumnDef } from '@org/types/export';

export const PRICE_LIST_EXPORT_COLUMNS: ExportColumnDef[] = [
  { field: 'name', headerKey: 'frontend.admin.priceLists.table.name', type: 'text', width: 25 },
  { field: 'type', headerKey: 'frontend.admin.priceLists.table.type', type: 'text', width: 12 },
  { field: 'status', headerKey: 'frontend.admin.priceLists.table.status', type: 'text', width: 12 },
  { field: 'defaultCurrencyCode', headerKey: 'frontend.admin.priceLists.table.defaultCurrencyCode', type: 'text', width: 10 },
  { field: 'isActive', headerKey: 'frontend.admin.priceLists.table.isActive', type: 'boolean', width: 10 },
  { field: 'priority', headerKey: 'frontend.admin.priceLists.table.priority', type: 'number', width: 10 },
  { field: 'validFrom', headerKey: 'frontend.admin.priceLists.table.validFrom', type: 'datetime', width: 22 },
  { field: 'validTo', headerKey: 'frontend.admin.priceLists.table.validTo', type: 'datetime', width: 22 },
  { field: 'sourceSystem', headerKey: 'frontend.admin.priceLists.table.sourceSystem', type: 'text', width: 12 },
  { field: 'isExchangeRateDerived', headerKey: 'frontend.admin.priceLists.table.isExchangeRateDerived', type: 'boolean', width: 12 },
  { field: 'sourceCurrencyCode', headerKey: 'frontend.admin.priceLists.table.sourceCurrencyCode', type: 'text', width: 10 },
  { field: 'isSourceLocked', headerKey: 'frontend.admin.priceLists.table.isSourceLocked', type: 'boolean', width: 10 },
  { field: 'store.name', headerKey: 'frontend.admin.priceLists.table.store', type: 'text', width: 20 },
  { field: '_count.prices', headerKey: 'frontend.admin.priceLists.table.pricesCount', type: 'number', width: 12 },
  { field: '_count.assignments', headerKey: 'frontend.admin.priceLists.table.assignmentsCount', type: 'number', width: 12 },
  { field: 'createdAt', headerKey: 'frontend.admin.priceLists.table.createdAt', type: 'datetime', width: 22 },
];
