import {
  BOOLEAN_FILTER_OPS,
  DATE_FILTER_OPS,
  ENUM_FILTER_OPS,
  NUMBER_FILTER_OPS,
  TEXT_FILTER_OPS,
} from '@org/types/data-query';
import {
  RULE_LOGICAL_OPERATORS,
  RULE_TARGET_ENTITIES,
} from '@org/types/rule-engine';
import { z } from 'zod';

const textRuleConditionSchema = z.object({
  filterType: z.literal('text'),
  field: z.string().min(1),
  op: z.enum(TEXT_FILTER_OPS),
  value: z.string().min(1),
});

const numberRuleConditionSchema = z
  .object({
    filterType: z.literal('number'),
    field: z.string().min(1),
    op: z.enum(NUMBER_FILTER_OPS),
    value: z.coerce.number(),
    valueTo: z.coerce.number().optional(),
  })
  .refine((d) => d.op !== 'between' || d.valueTo !== undefined, {
    message: 'valueTo required for between',
  });

const dateRuleConditionSchema = z
  .object({
    filterType: z.literal('date'),
    field: z.string().min(1),
    op: z.enum(DATE_FILTER_OPS),
    value: z.string(),
    valueTo: z.string().optional(),
  })
  .refine((d) => d.op !== 'between' || d.valueTo !== undefined, {
    message: 'valueTo required for between',
  });

const booleanRuleConditionSchema = z.object({
  filterType: z.literal('boolean'),
  field: z.string().min(1),
  op: z.enum(BOOLEAN_FILTER_OPS),
  value: z.coerce.boolean(),
});

const enumRuleConditionSchema = z.object({
  filterType: z.literal('enum'),
  field: z.string().min(1),
  op: z.enum(ENUM_FILTER_OPS),
  value: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
});

const ruleConditionSchema = z.discriminatedUnion('filterType', [
  textRuleConditionSchema,
  numberRuleConditionSchema,
  dateRuleConditionSchema,
  booleanRuleConditionSchema,
  enumRuleConditionSchema,
]);

export type RuleGroupInput = {
  operator: 'AND' | 'OR';
  conditions: Array<z.infer<typeof ruleConditionSchema> | RuleGroupInput>;
};

const ruleGroupSchema: z.ZodType<RuleGroupInput> = z.lazy(() =>
  z.object({
    operator: z.enum(RULE_LOGICAL_OPERATORS),
    conditions: z
      .array(z.union([ruleConditionSchema, ruleGroupSchema]))
      .min(1, 'Rule group must have at least one condition'),
  })
);

export { ruleConditionSchema, ruleGroupSchema };

export const createRuleTreeSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  targetEntity: z.enum(RULE_TARGET_ENTITIES),
  conditions: ruleGroupSchema,
  isActive: z.boolean().optional().default(true),
});

export const updateRuleTreeSchema = createRuleTreeSchema.partial();

export type CreateRuleTreeInput = z.infer<typeof createRuleTreeSchema>;
export type UpdateRuleTreeInput = z.infer<typeof updateRuleTreeSchema>;

const customerGroupBase = {
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color')
    .optional(),
  isActive: z.boolean().optional().default(true),
};

export const createRuleBasedCustomerGroupSchema = z.object({
  ...customerGroupBase,
  type: z.literal('RULE_BASED'),
  ruleTreeId: z.cuid2().optional(),
  ruleTree: createRuleTreeSchema.omit({ targetEntity: true }).optional(),
});

export const createManualCustomerGroupSchema = z.object({
  ...customerGroupBase,
  type: z.literal('MANUAL'),
  memberIds: z.array(z.cuid2()).optional(),
});

export const updateCustomerGroupSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color')
    .optional(),
  isActive: z.boolean().optional(),
});

export type CreateRuleBasedCustomerGroupInput = z.infer<
  typeof createRuleBasedCustomerGroupSchema
>;
export type CreateManualCustomerGroupInput = z.infer<
  typeof createManualCustomerGroupSchema
>;
export type CreateCustomerGroupInput =
  | CreateRuleBasedCustomerGroupInput
  | CreateManualCustomerGroupInput;
export type UpdateCustomerGroupInput = z.infer<
  typeof updateCustomerGroupSchema
>;

export const modifyMembersSchema = z.object({
  userIds: z.array(z.cuid2()).min(1),
});

export type ModifyMembersInput = z.infer<typeof modifyMembersSchema>;

export const evaluatePreviewSchema = z.object({
  targetEntity: z.enum(RULE_TARGET_ENTITIES),
  conditions: ruleGroupSchema,
});

export type EvaluatePreviewInput = z.infer<typeof evaluatePreviewSchema>;
