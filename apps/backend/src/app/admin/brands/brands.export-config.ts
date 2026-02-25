import type { ExportColumnDef } from '@org/types/export';

export const BRAND_EXPORT_COLUMNS: ExportColumnDef[] = [
  { field: 'slug', headerKey: 'common.admin.brands.table.slug', type: 'text', width: 20 },
  { field: 'isActive', headerKey: 'common.admin.brands.table.isActive', type: 'boolean', width: 12 },
  { field: 'websiteUrl', headerKey: 'common.admin.brands.table.websiteUrl', type: 'text', width: 30 },
  { field: '_count.products', headerKey: 'common.admin.brands.table.productsCount', type: 'number', width: 12 },
  { field: 'createdAt', headerKey: 'common.admin.brands.table.createdAt', type: 'datetime', width: 22 },
];
