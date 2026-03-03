import { RuleLogicalOperator } from '@org/types/rule-engine';
import { z } from 'zod';
import { V } from '../common/validation-keys.js';
import { ruleConditionSchema } from './rule-engine-zod-schema.js';

export const conditionSetSchema = z.object({
  operator: z.enum(RuleLogicalOperator),
  conditions: z
    .array(ruleConditionSchema)
    .min(1, { message: V.CONDITION_SET_MIN_CONDITIONS }),
});

export type ConditionSetInput = z.input<typeof conditionSetSchema>;
export type ConditionSetOutput = z.output<typeof conditionSetSchema>;
