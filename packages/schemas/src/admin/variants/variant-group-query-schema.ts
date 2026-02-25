import {
  ADMIN_VARIANT_GROUPS_FIELD_CONFIG,
  ADMIN_VARIANT_GROUPS_SORT_FIELDS,
} from '@org/types/admin/variants';
import { z } from 'zod';
import { createDataQuerySchema } from '../../data-query/index.js';

export const VariantGroupQuerySchema = createDataQuerySchema({
  fields: ADMIN_VARIANT_GROUPS_FIELD_CONFIG,
  sortFields: ADMIN_VARIANT_GROUPS_SORT_FIELDS,
});

export type VariantGroupQuerySchemaType = z.infer<
  typeof VariantGroupQuerySchema
>;
