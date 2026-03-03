import type {
  BooleanFilterOp,
  DateFilterOp,
  EnumFilterOp,
  NumberFilterOp,
  TextFilterOp,
} from '@org/types/data-query';

export const RuleLogicalOperator = ['AND', 'OR'] as const;
export type RuleLogicalOperator = (typeof RuleLogicalOperator)[number];

export const RuleTargetEntity = ['USER', 'PRODUCT', 'ORDER', 'INVENTORY'] as const;
export type RuleTargetEntity = (typeof RuleTargetEntity)[number];

export const CustomerGroupType = ['RULE_BASED', 'MANUAL'] as const;
export type CustomerGroupType = (typeof CustomerGroupType)[number];

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

// ─── Condition Set (flat evaluation) ─────────────────────────────────────────

export interface ConditionSet {
  operator: RuleLogicalOperator;
  conditions: RuleCondition[];
}

// ─── Decision Tree ────────────────────────────────────────────────────────────

export const DecisionTreeNodeType = ['condition', 'conditionGroup', 'result'] as const;
export type DecisionTreeNodeType = (typeof DecisionTreeNodeType)[number];

export const DecisionTreeAction = ['include', 'exclude'] as const;
export type DecisionTreeAction = (typeof DecisionTreeAction)[number];

export const MembershipAction = ['include', 'exclude'] as const;
export type MembershipAction = (typeof MembershipAction)[number];

export interface DecisionTreeConditionNode {
  id: string;
  type: 'condition';
  condition: RuleCondition;
  yesBranch: string | null;
  noBranch: string | null;
}

export interface DecisionTreeConditionGroupNode {
  id: string;
  type: 'conditionGroup';
  operator: RuleLogicalOperator;
  conditions: RuleCondition[];
  yesBranch: string | null;
  noBranch: string | null;
}

export interface DecisionTreeResultNode<TAction extends string = string> {
  id: string;
  type: 'result';
  action: TAction;
  label?: string;
}

export type DecisionTreeNode<TAction extends string = string> =
  | DecisionTreeConditionNode
  | DecisionTreeConditionGroupNode
  | DecisionTreeResultNode<TAction>;

export interface DecisionTree<TAction extends string = string> {
  rootNodeId: string;
  nodes: DecisionTreeNode<TAction>[];
}

export type MembershipDecisionTree = DecisionTree<MembershipAction>;
export type MembershipResultNode = DecisionTreeResultNode<MembershipAction>;

export function isConditionNode<TAction extends string = string>(
  node: DecisionTreeNode<TAction>
): node is DecisionTreeConditionNode {
  return node.type === 'condition';
}

export function isConditionGroupNode<TAction extends string = string>(
  node: DecisionTreeNode<TAction>
): node is DecisionTreeConditionGroupNode {
  return node.type === 'conditionGroup';
}

export function isResultNode<TAction extends string = string>(
  node: DecisionTreeNode<TAction>
): node is DecisionTreeResultNode<TAction> {
  return node.type === 'result';
}

export * from './field-configs.js';
