import type { ExportColumnDef } from '@org/types/export';

export const PRODUCT_EXPORT_COLUMNS: ExportColumnDef[] = [
  {
    field: 'type',
    headerKey: 'frontend.admin.products.table.type',
    type: 'badge',
    width: 15,
    labelMap: { PHYSICAL: 'Physical', DIGITAL: 'Digital' },
  },
  {
    field: 'status',
    headerKey: 'frontend.admin.products.table.status',
    type: 'badge',
    width: 15,
    labelMap: { DRAFT: 'Draft', ACTIVE: 'Active', ARCHIVED: 'Archived' },
  },
  { field: '_count.variants', headerKey: 'frontend.admin.products.table.variantCount', type: 'number', width: 12 },
  { field: '_count.categories', headerKey: 'frontend.admin.products.table.categoryCount', type: 'number', width: 12 },
  { field: '_count.tags', headerKey: 'frontend.admin.products.table.tagCount', type: 'number', width: 12 },
  { field: 'createdAt', headerKey: 'frontend.admin.products.table.createdAt', type: 'datetime', width: 22 },
  { field: 'updatedAt', headerKey: 'frontend.admin.products.table.updatedAt', type: 'datetime', width: 22 },
];
