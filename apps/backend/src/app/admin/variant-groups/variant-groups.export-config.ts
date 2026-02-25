import type { ExportColumnDef } from '@org/types/export';

export const VARIANT_GROUP_EXPORT_COLUMNS: ExportColumnDef[] = [
  { field: '_count.options', headerKey: 'common.admin.variants.table.optionsCount', type: 'number', width: 12 },
  { field: '_count.products', headerKey: 'common.admin.variants.table.productsCount', type: 'number', width: 12 },
  { field: 'createdAt', headerKey: 'common.admin.variants.table.createdAt', type: 'datetime', width: 22 },
  { field: 'updatedAt', headerKey: 'common.admin.variants.table.updatedAt', type: 'datetime', width: 22 },
];
