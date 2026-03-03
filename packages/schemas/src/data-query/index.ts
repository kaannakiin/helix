import type { FieldFilterConfig } from '@org/types/data-query';
import {
  BOOLEAN_FILTER_OPS,
  DATE_FILTER_OPS,
  ENUM_FILTER_OPS,
  NUMBER_FILTER_OPS,
  SORT_ORDERS,
  TEXT_FILTER_OPS,
} from '@org/types/data-query';
import { z } from 'zod';

const textFilterSchema = z.object({
  filterType: z.literal('text'),
  op: z.enum(TEXT_FILTER_OPS),
  value: z.string().min(1),
});

const numberFilterSchema = z
  .object({
    filterType: z.literal('number'),
    op: z.enum(NUMBER_FILTER_OPS),
    value: z.coerce.number(),
    valueTo: z.coerce.number().optional(),
  })
  .refine((d) => d.op !== 'between' || d.valueTo !== undefined, {
    message: 'valueTo required for between',
  });

const dateFilterSchema = z
  .object({
    filterType: z.literal('date'),
    op: z.enum(DATE_FILTER_OPS),
    value: z.string(),
    valueTo: z.string().optional(),
  })
  .refine((d) => d.op !== 'between' || d.valueTo !== undefined, {
    message: 'valueTo required for between',
  });

const booleanFilterSchema = z.object({
  filterType: z.literal('boolean'),
  op: z.enum(BOOLEAN_FILTER_OPS),
  value: z.coerce.boolean(),
});

function enumFilterSchema(allowedValues?: readonly string[]) {
  const baseValue = allowedValues
    ? z.enum(allowedValues as [string, ...string[]])
    : z.string();

  return z.object({
    filterType: z.literal('enum'),
    op: z.enum(ENUM_FILTER_OPS),
    value: z.union([baseValue, z.array(baseValue)]),
  });
}

function filterSchemaForType(
  filterType: string,
  options?: { values?: readonly string[] }
): z.ZodTypeAny {
  switch (filterType) {
    case 'text':
      return textFilterSchema;
    case 'number':
      return numberFilterSchema;
    case 'date':
      return dateFilterSchema;
    case 'boolean':
      return booleanFilterSchema;
    case 'enum':
      return enumFilterSchema(options?.values);
    default:
      return textFilterSchema;
  }
}

export function createDataQuerySchema<
  TFields extends Record<string, FieldFilterConfig>,
  TSortFields extends readonly string[]
>(config: { fields: TFields; sortFields: TSortFields; maxLimit?: number }) {
  const { fields, sortFields, maxLimit = 100 } = config;

  const filterShape: Record<string, z.ZodOptional<z.ZodTypeAny>> = {};
  for (const [fieldName, fieldConfig] of Object.entries(fields)) {
    filterShape[fieldName] = filterSchemaForType(
      fieldConfig.filterType,
      fieldConfig
    ).optional();
  }

  const filtersSchema = z.object(filterShape);

  const plainSortItemSchema = z.object({
    field: z.enum(sortFields as unknown as [string, ...string[]]),
    order: z.enum(SORT_ORDERS),
  });

  const sortItemSchema = plainSortItemSchema;

  return z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(maxLimit).default(maxLimit),
    filters: filtersSchema.optional(),
    sort: z.array(sortItemSchema).optional(),
  });
}

export type DataQuerySchemaType<
  T extends ReturnType<typeof createDataQuerySchema>
> = z.infer<T>;
