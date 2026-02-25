import {
  ADMIN_CATEGORIES_FIELD_CONFIG,
  ADMIN_CATEGORIES_SORT_FIELDS,
} from '@org/types/admin/categories';
import { z } from 'zod';
import { createDataQuerySchema } from '../../data-query/index.js';

export const CategoryQuerySchema = createDataQuerySchema({
  fields: ADMIN_CATEGORIES_FIELD_CONFIG,
  sortFields: ADMIN_CATEGORIES_SORT_FIELDS,
});

export type CategoryQuerySchemaType = z.infer<typeof CategoryQuerySchema>;
