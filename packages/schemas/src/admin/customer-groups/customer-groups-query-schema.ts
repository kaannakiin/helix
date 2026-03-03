import {
  ADMIN_CUSTOMER_GROUPS_FIELD_CONFIG,
  ADMIN_CUSTOMER_GROUPS_SORT_FIELDS,
} from '@org/types/admin/customer-groups';
import { z } from 'zod';
import { createDataQuerySchema } from '../../data-query/index.js';

export const CustomerGroupQuerySchema = createDataQuerySchema({
  fields: ADMIN_CUSTOMER_GROUPS_FIELD_CONFIG,
  sortFields: ADMIN_CUSTOMER_GROUPS_SORT_FIELDS,
});

export type CustomerGroupQuerySchemaType = z.infer<
  typeof CustomerGroupQuerySchema
>;
