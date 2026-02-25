import {
  ADMIN_PRODUCTS_FIELD_CONFIG,
  ADMIN_PRODUCTS_SORT_FIELDS,
} from '@org/types/admin/products';
import { z } from 'zod';
import { createDataQuerySchema } from '../../data-query/index.js';

export const ProductQuerySchema = createDataQuerySchema({
  fields: ADMIN_PRODUCTS_FIELD_CONFIG,
  sortFields: ADMIN_PRODUCTS_SORT_FIELDS,
});

export type ProductQuerySchemaType = z.infer<typeof ProductQuerySchema>;
