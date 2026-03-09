import {
  ADMIN_CUSTOMERS_FIELD_CONFIG,
  ADMIN_CUSTOMERS_SORT_FIELDS,
} from '@org/types/admin/customers';
import { z } from 'zod';
import { createDataQuerySchema } from '../../data-query/index.js';

export const CustomerQuerySchema = createDataQuerySchema({
  fields: ADMIN_CUSTOMERS_FIELD_CONFIG,
  sortFields: ADMIN_CUSTOMERS_SORT_FIELDS,
});

export type CustomerQuerySchemaType = z.infer<typeof CustomerQuerySchema>;
