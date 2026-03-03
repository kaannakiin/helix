import type { ExportColumnDef } from '@org/types/export';

export const CATEGORY_EXPORT_COLUMNS: ExportColumnDef[] = [
  { field: 'slug', headerKey: 'frontend.admin.categories.table.slug', type: 'text', width: 20 },
  { field: 'depth', headerKey: 'frontend.admin.categories.table.depth', type: 'number', width: 10 },
  { field: 'isActive', headerKey: 'frontend.admin.categories.table.isActive', type: 'boolean', width: 12 },
  { field: '_count.children', headerKey: 'frontend.admin.categories.table.childrenCount', type: 'number', width: 12 },
  { field: '_count.products', headerKey: 'frontend.admin.categories.table.productsCount', type: 'number', width: 12 },
  { field: 'createdAt', headerKey: 'frontend.admin.categories.table.createdAt', type: 'datetime', width: 22 },
];
