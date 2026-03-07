import {
  ADMIN_WAREHOUSES_FIELD_CONFIG,
  ADMIN_WAREHOUSES_SORT_FIELDS,
} from '@org/types/admin/warehouses';
import { z } from 'zod';
import { createDataQuerySchema } from '../../data-query/index.js';

export const WarehouseQuerySchema = createDataQuerySchema({
  fields: ADMIN_WAREHOUSES_FIELD_CONFIG,
  sortFields: ADMIN_WAREHOUSES_SORT_FIELDS,
});

export type WarehouseQuerySchemaType = z.infer<typeof WarehouseQuerySchema>;
