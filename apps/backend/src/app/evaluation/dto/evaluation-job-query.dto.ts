import { createDataQuerySchema } from '@org/schemas/data-query';
import type { FieldFilterConfig } from '@org/types/data-query';
import { createZodDto, type ZodDto } from 'nestjs-zod';
import { z } from 'zod';

const EVALUATION_JOB_FIELD_CONFIG: Record<string, FieldFilterConfig> = {
  status: {
    filterType: 'enum',
    values: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'],
  },
  targetEntity: {
    filterType: 'enum',
    values: ['USER', 'PRODUCT', 'ORDER', 'INVENTORY'],
  },
  entityType: { filterType: 'text' },
  triggerType: { filterType: 'enum', values: ['SCHEDULED', 'MANUAL'] },
  createdAt: { filterType: 'date' },
};

const EVALUATION_JOB_SORT_FIELDS = [
  'status',
  'entityType',
  'targetEntity',
  'triggerType',
  'triggeredBy',
  'recordsEvaluated',
  'recordsMatched',
  'durationMs',
  'createdAt',
  'startedAt',
  'completedAt',
] as const;

export const EvaluationJobQuerySchema = createDataQuerySchema({
  fields: EVALUATION_JOB_FIELD_CONFIG,
  sortFields: EVALUATION_JOB_SORT_FIELDS,
});

export type EvaluationJobQuerySchemaType = z.infer<
  typeof EvaluationJobQuerySchema
>;

export class EvaluationJobQueryDTO extends (createZodDto(
  EvaluationJobQuerySchema
) as ZodDto<typeof EvaluationJobQuerySchema, false>) {}
