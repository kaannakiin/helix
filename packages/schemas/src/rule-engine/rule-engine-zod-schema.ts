import {
  BOOLEAN_FILTER_OPS,
  DATE_FILTER_OPS,
  ENUM_FILTER_OPS,
  NUMBER_FILTER_OPS,
  TEXT_FILTER_OPS,
} from '@org/types/data-query';
import {
  DecisionTreeAction,
  RuleLogicalOperator,
} from '@org/types/rule-engine';
import { z } from 'zod';
import { V } from '../common/validation-keys.js';

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

export { ruleConditionSchema };

const decisionTreeConditionNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('condition'),
  condition: ruleConditionSchema,
  yesBranch: z.string().min(1).nullable(),
  noBranch: z.string().min(1).nullable(),
});

const decisionTreeConditionGroupNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('conditionGroup'),
  operator: z.enum(RuleLogicalOperator),
  conditions: z
    .array(ruleConditionSchema)
    .min(2, { error: V.DECISION_TREE_MIN_CONDITIONS }),
  yesBranch: z.string().min(1).nullable(),
  noBranch: z.string().min(1).nullable(),
});

interface CheckableTreeValue {
  rootNodeId: string;
  nodes: Array<{
    id: string;
    type: string;
    yesBranch?: string | null;
    noBranch?: string | null;
  }>;
}

const checkDecisionTree = ({
  issues,
  value,
}: {
  issues: z.core.$ZodRawIssue[];
  value: CheckableTreeValue;
}) => {
  const nodeIds = new Set(value.nodes.map((n) => n.id));

  if (!nodeIds.has(value.rootNodeId)) {
    issues.push({
      code: 'custom',
      input: value.rootNodeId,
      message: V.DECISION_TREE_ROOT_NOT_FOUND,
      path: ['rootNodeId'],
    });
  }

  const referencedIds = new Set<string>([value.rootNodeId]);

  for (let i = 0; i < value.nodes.length; i++) {
    const node = value.nodes[i];
    if (node.type !== 'result') {
      if (node.yesBranch) {
        referencedIds.add(node.yesBranch);
        if (!nodeIds.has(node.yesBranch)) {
          issues.push({
            code: 'custom',
            input: node.yesBranch,
            message: V.DECISION_TREE_INVALID_BRANCH_REF,
            path: ['nodes', i, 'yesBranch'],
          });
        }
      }
      if (node.noBranch) {
        referencedIds.add(node.noBranch);
        if (!nodeIds.has(node.noBranch)) {
          issues.push({
            code: 'custom',
            input: node.noBranch,
            message: V.DECISION_TREE_INVALID_BRANCH_REF,
            path: ['nodes', i, 'noBranch'],
          });
        }
      }
    }
  }

  for (let i = 0; i < value.nodes.length; i++) {
    if (!referencedIds.has(value.nodes[i].id)) {
      issues.push({
        code: 'custom',
        input: value.nodes[i].id,
        message: V.DECISION_TREE_ORPHAN_NODE,
        path: ['nodes', i],
      });
    }
  }
};

export function createResultNodeSchema<
  T extends readonly [string, ...string[]]
>(actions: T) {
  return z.object({
    id: z.string().min(1),
    type: z.literal('result'),
    action: z.enum(actions),
    label: z.string().max(200).optional(),
  });
}

export function createDecisionTreeSchema<
  T extends readonly [string, ...string[]]
>(actions: T) {
  const resultNodeSchema = createResultNodeSchema(actions);

  const nodeSchema = z.discriminatedUnion('type', [
    decisionTreeConditionNodeSchema,
    decisionTreeConditionGroupNodeSchema,
    resultNodeSchema,
  ]);

  const BaseSchema = z.object({
    rootNodeId: z.string().min(1, { error: V.DECISION_TREE_ROOT_REQUIRED }),
    nodes: z.array(nodeSchema).min(1, { error: V.DECISION_TREE_NODES_MIN }),
  });

  return BaseSchema.check(checkDecisionTree);
}

export function createSimpleDecisionTreeSchema<
  T extends readonly [string, ...string[]]
>(actions: T) {
  const resultNodeSchema = createResultNodeSchema(actions);

  const nodeSchema = z.discriminatedUnion('type', [
    decisionTreeConditionNodeSchema,
    decisionTreeConditionGroupNodeSchema,
    resultNodeSchema,
  ]);

  const BaseSchema = z.object({
    rootNodeId: z.string().min(1, { error: V.DECISION_TREE_ROOT_REQUIRED }),
    nodes: z.array(nodeSchema).min(1, { error: V.DECISION_TREE_NODES_MIN }),
  });

  return BaseSchema.check(({ issues, value }) => {
    checkDecisionTree({ issues, value });

    const resultNodes = value.nodes.filter((n) => n.type === 'result');
    if (resultNodes.length > 1) {
      issues.push({
        code: 'custom',
        input: resultNodes.length,
        message: V.DECISION_TREE_SIMPLE_MULTIPLE_RESULTS,
        path: ['nodes'],
      });
    }

    for (let i = 0; i < value.nodes.length; i++) {
      const node = value.nodes[i];
      if (node.type !== 'result' && node.noBranch !== null) {
        issues.push({
          code: 'custom',
          input: node.noBranch,
          message: V.DECISION_TREE_SIMPLE_NO_BRANCH_NOT_ALLOWED,
          path: ['nodes', i, 'noBranch'],
        });
      }
    }
  });
}

const decisionTreeResultNodeSchema = createResultNodeSchema(DecisionTreeAction);

const decisionTreeNodeSchema = z.discriminatedUnion('type', [
  decisionTreeConditionNodeSchema,
  decisionTreeConditionGroupNodeSchema,
  decisionTreeResultNodeSchema,
]);

export const decisionTreeSchema = createDecisionTreeSchema(DecisionTreeAction);

export {
  decisionTreeConditionGroupNodeSchema,
  decisionTreeConditionNodeSchema,
  decisionTreeNodeSchema,
  decisionTreeResultNodeSchema,
};

export type DecisionTreeInput = z.input<typeof decisionTreeSchema>;
export type DecisionTreeOutput = z.output<typeof decisionTreeSchema>;
