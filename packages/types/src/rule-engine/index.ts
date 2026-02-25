import type {
  BooleanFilterOp,
  DateFilterOp,
  EnumFilterOp,
  NumberFilterOp,
  TextFilterOp,
} from '@org/types/data-query';

export const RULE_LOGICAL_OPERATORS = ['AND', 'OR'] as const;
export type RuleLogicalOperator = (typeof RULE_LOGICAL_OPERATORS)[number];

export const RULE_TARGET_ENTITIES = ['USER', 'PRODUCT', 'ORDER'] as const;
export type RuleTargetEntity = (typeof RULE_TARGET_ENTITIES)[number];

export const CUSTOMER_GROUP_TYPES = ['RULE_BASED', 'MANUAL'] as const;
export type CustomerGroupType = (typeof CUSTOMER_GROUP_TYPES)[number];

export interface TextRuleCondition {
  filterType: 'text';
  field: string;
  op: TextFilterOp;
  value: string;
}

export interface NumberRuleCondition {
  filterType: 'number';
  field: string;
  op: NumberFilterOp;
  value: number;
  valueTo?: number;
}

export interface DateRuleCondition {
  filterType: 'date';
  field: string;
  op: DateFilterOp;
  value: string;
  valueTo?: string;
}

export interface BooleanRuleCondition {
  filterType: 'boolean';
  field: string;
  op: BooleanFilterOp;
  value: boolean;
}

export interface EnumRuleCondition {
  filterType: 'enum';
  field: string;
  op: EnumFilterOp;
  value: string | string[];
}

export type RuleCondition =
  | TextRuleCondition
  | NumberRuleCondition
  | DateRuleCondition
  | BooleanRuleCondition
  | EnumRuleCondition;

export interface RuleGroup {
  operator: RuleLogicalOperator;
  conditions: Array<RuleCondition | RuleGroup>;
}

export function isRuleGroup(
  item: RuleCondition | RuleGroup
): item is RuleGroup {
  return 'operator' in item && 'conditions' in item && !('field' in item);
}
export * from './field-configs.js';
