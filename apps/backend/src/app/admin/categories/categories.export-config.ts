import type { ExportColumnDef } from '@org/types/export';

export const CATEGORY_EXPORT_COLUMNS: ExportColumnDef[] = [
  { field: 'slug', headerKey: 'common.admin.categories.table.slug', type: 'text', width: 20 },
  { field: 'depth', headerKey: 'common.admin.categories.table.depth', type: 'number', width: 10 },
  { field: 'isActive', headerKey: 'common.admin.categories.table.isActive', type: 'boolean', width: 12 },
  { field: '_count.children', headerKey: 'common.admin.categories.table.childrenCount', type: 'number', width: 12 },
  { field: '_count.products', headerKey: 'common.admin.categories.table.productsCount', type: 'number', width: 12 },
  { field: 'createdAt', headerKey: 'common.admin.categories.table.createdAt', type: 'datetime', width: 22 },
];
