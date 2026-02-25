import {
  ADMIN_BRANDS_FIELD_CONFIG,
  ADMIN_BRANDS_SORT_FIELDS,
} from '@org/types/admin/brands';
import { z } from 'zod';
import { createDataQuerySchema } from '../../data-query/index.js';

export const BrandQuerySchema = createDataQuerySchema({
  fields: ADMIN_BRANDS_FIELD_CONFIG,
  sortFields: ADMIN_BRANDS_SORT_FIELDS,
});

export type BrandQuerySchemaType = z.infer<typeof BrandQuerySchema>;
