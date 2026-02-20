import type { FieldFilterConfig } from '@org/types/data-query';
import { z } from 'zod';
import { createDataQuerySchema } from '../data-query/index.js';

export function createExportQuerySchema<
  TFields extends Record<string, FieldFilterConfig>,
  TSortFields extends readonly string[],
>(config: { fields: TFields; sortFields: TSortFields }) {
  const baseSchema = createDataQuerySchema({
    fields: config.fields,
    sortFields: config.sortFields,
    maxLimit: 999999,
  });

  return baseSchema.omit({ page: true, limit: true }).extend({
    format: z.enum(['xlsx', 'csv']),
    columns: z
      .string()
      .transform((str) => JSON.parse(str) as unknown)
      .pipe(z.array(z.string()))
      .optional(),
    headers: z
      .string()
      .transform((str) => JSON.parse(str) as unknown)
      .pipe(z.record(z.string(), z.string()))
      .optional(),
    filename: z.string().max(200).optional(),
  });
}
