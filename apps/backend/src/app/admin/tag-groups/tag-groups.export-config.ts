import type { ExportColumnDef } from '@org/types/export';

export const TAG_GROUP_EXPORT_COLUMNS: ExportColumnDef[] = [
  { field: 'slug', headerKey: 'common.admin.tags.table.slug', type: 'text', width: 20 },
  { field: 'isActive', headerKey: 'common.admin.tags.table.isActive', type: 'boolean', width: 12 },
  { field: '_count.tags', headerKey: 'common.admin.tags.table.tagsCount', type: 'number', width: 12 },
  { field: 'createdAt', headerKey: 'common.admin.tags.table.createdAt', type: 'datetime', width: 22 },
];
