import {
  ADMIN_PRICE_LIST_PRICES_FIELD_CONFIG,
  ADMIN_PRICE_LIST_PRICES_SORT_FIELDS,
} from '@org/types/admin/pricing';
import { z } from 'zod';
import { createDataQuerySchema } from '../../data-query/index.js';

export const PriceListPriceQuerySchema = createDataQuerySchema({
  fields: ADMIN_PRICE_LIST_PRICES_FIELD_CONFIG,
  sortFields: ADMIN_PRICE_LIST_PRICES_SORT_FIELDS,
});

export type PriceListPriceQuerySchemaType = z.infer<
  typeof PriceListPriceQuerySchema
>;
