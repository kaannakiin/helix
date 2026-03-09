import {
  ADMIN_ORGANIZATIONS_FIELD_CONFIG,
  ADMIN_ORGANIZATIONS_SORT_FIELDS,
} from '@org/types/admin/organizations';
import { z } from 'zod';
import { createDataQuerySchema } from '../../data-query/index.js';

export const OrganizationQuerySchema = createDataQuerySchema({
  fields: ADMIN_ORGANIZATIONS_FIELD_CONFIG,
  sortFields: ADMIN_ORGANIZATIONS_SORT_FIELDS,
});

export type OrganizationQuerySchemaType = z.infer<
  typeof OrganizationQuerySchema
>;
