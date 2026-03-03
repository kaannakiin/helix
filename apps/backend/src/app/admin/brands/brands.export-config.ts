import type { ExportColumnDef } from '@org/types/export';

export const BRAND_EXPORT_COLUMNS: ExportColumnDef[] = [
  { field: 'slug', headerKey: 'frontend.admin.brands.table.slug', type: 'text', width: 20 },
  { field: 'isActive', headerKey: 'frontend.admin.brands.table.isActive', type: 'boolean', width: 12 },
  { field: 'websiteUrl', headerKey: 'frontend.admin.brands.table.websiteUrl', type: 'text', width: 30 },
  { field: '_count.products', headerKey: 'frontend.admin.brands.table.productsCount', type: 'number', width: 12 },
  { field: 'createdAt', headerKey: 'frontend.admin.brands.table.createdAt', type: 'datetime', width: 22 },
];
