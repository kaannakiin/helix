import {
  ADMIN_CUSTOMERS_FIELD_CONFIG,
  ADMIN_CUSTOMERS_SORT_FIELDS,
} from '@org/types/admin/customers';
import { z } from 'zod';
import { createDataQuerySchema } from '../../data-query/index.js';

export const UserQuerySchema = createDataQuerySchema({
  fields: ADMIN_CUSTOMERS_FIELD_CONFIG,
  sortFields: ADMIN_CUSTOMERS_SORT_FIELDS,
});

export type UserQuerySchemaType = z.infer<typeof UserQuerySchema>;
