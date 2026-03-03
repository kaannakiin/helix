import {
  ADMIN_PRICE_LISTS_FIELD_CONFIG,
  ADMIN_PRICE_LISTS_SORT_FIELDS,
} from '@org/types/admin/pricing';
import { z } from 'zod';
import { createDataQuerySchema } from '../../data-query/index.js';

export const PriceListQuerySchema = createDataQuerySchema({
  fields: ADMIN_PRICE_LISTS_FIELD_CONFIG,
  sortFields: ADMIN_PRICE_LISTS_SORT_FIELDS,
});

export type PriceListQuerySchemaType = z.infer<typeof PriceListQuerySchema>;
