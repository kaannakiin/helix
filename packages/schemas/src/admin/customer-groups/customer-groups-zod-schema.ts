import { CustomerGroupType, MembershipAction } from '@org/types/rule-engine';
import { createId } from '@paralleldrive/cuid2';
import { z } from 'zod';
import { hexColorSchema } from '../../common/common-schemas.js';
import { V } from '../../common/validation-keys.js';
import { createSimpleDecisionTreeSchema } from '../../rule-engine/index.js';

export const membershipDecisionTreeSchema =
  createSimpleDecisionTreeSchema(MembershipAction);

const inlineRuleTreeSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  tree: membershipDecisionTreeSchema.optional(),
  isActive: z.boolean().optional().default(true),
});

export const BaseCustomerGroupSchema = z.object({
  id: z.cuid2(),
  name: z
    .string({ error: V.CUSTOMER_GROUP_NAME_REQUIRED })
    .trim()
    .min(1, { error: V.CUSTOMER_GROUP_NAME_REQUIRED })
    .max(200),
  description: z.string().max(1000).optional(),
  color: hexColorSchema,
  type: z.enum(CustomerGroupType, {
    error: V.CUSTOMER_GROUP_TYPE_REQUIRED,
  }),
  isActive: z.boolean().default(true),
  ruleTreeId: z.cuid2().optional(),
  ruleTree: inlineRuleTreeSchema.optional(),
  cronExpression: z.string().trim().optional().default('0 * * * *'),
  memberIds: z.array(z.cuid2()).optional(),
});

const checkCustomerGroup = ({
  issues,
  value,
}: z.core.ParsePayload<z.output<typeof BaseCustomerGroupSchema>>) => {
  if (value.type === 'RULE_BASED') {
    if (!value.ruleTreeId && !value.ruleTree) {
      issues.push({
        code: 'custom',
        input: value.type,
        message: V.CUSTOMER_GROUP_RULE_TREE_REQUIRED,
        path: ['ruleTreeId'],
      });
    }
  }

  if (value.type === 'MANUAL') {
    if (!value.memberIds || value.memberIds.length === 0) {
      issues.push({
        code: 'custom',
        input: value.memberIds,
        message: V.CUSTOMER_GROUP_MEMBERS_MIN,
        path: ['memberIds'],
      });
    }
  }
};

export const CustomerGroupSchema =
  BaseCustomerGroupSchema.check(checkCustomerGroup);

export type CustomerGroupInput = z.input<typeof CustomerGroupSchema>;
export type CustomerGroupOutput = z.output<typeof CustomerGroupSchema>;

export const NEW_CUSTOMER_GROUP_DEFAULT_VALUES: CustomerGroupInput = {
  id: createId(),
  name: '',
  description: '',
  color: '',
  type: 'MANUAL',
  isActive: true,
  cronExpression: '0 * * * *',
  memberIds: [],
};

export const ModifyMembersSchema = z.object({
  userIds: z.array(z.cuid2()).min(1, { error: V.CUSTOMER_GROUP_MEMBERS_MIN }),
});

export type ModifyMembersInput = z.input<typeof ModifyMembersSchema>;
export type ModifyMembersOutput = z.output<typeof ModifyMembersSchema>;
