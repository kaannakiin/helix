import type { FieldFilterConfig } from '@org/types/data-query';
import type {
  DecisionTreeConditionGroupNode,
  DecisionTreeConditionNode,
  DecisionTreeResultNode,
  RuleCondition,
  RuleLogicalOperator,
} from '@org/types/rule-engine';
import { createId } from '@paralleldrive/cuid2';

export function createDefaultCondition(
  field: string,
  config: FieldFilterConfig
): RuleCondition {
  switch (config.filterType) {
    case 'text':
      return { filterType: 'text', field, op: 'contains', value: '' };
    case 'number':
      return { filterType: 'number', field, op: 'equals', value: 0 };
    case 'date':
      return { filterType: 'date', field, op: 'equals', value: '' };
    case 'boolean':
      return { filterType: 'boolean', field, op: 'equals', value: true };
    case 'enum':
      return {
        filterType: 'enum',
        field,
        op: 'equals',
        value: config.values?.[0] ?? '',
      };
    default:
      return { filterType: 'text', field, op: 'contains', value: '' };
  }
}

export function createDefaultConditionNode(
  field: string,
  config: FieldFilterConfig
): DecisionTreeConditionNode {
  return {
    id: createId(),
    type: 'condition',
    condition: createDefaultCondition(field, config),
    yesBranch: null,
    noBranch: null,
  };
}

export function createDefaultConditionGroupNode(
  operator: RuleLogicalOperator = 'AND',
  conditions: RuleCondition[] = []
): DecisionTreeConditionGroupNode {
  return {
    id: createId(),
    type: 'conditionGroup',
    operator,
    conditions,
    yesBranch: null,
    noBranch: null,
  };
}

export function createDefaultResultNode<TAction extends string>(
  action: TAction,
  label?: string
): DecisionTreeResultNode<TAction> {
  return {
    id: createId(),
    type: 'result',
    action,
    label: label ?? '',
  };
}

export function getFilterOpsForType(filterType: string): readonly string[] {
  switch (filterType) {
    case 'text':
      return ['contains', 'equals', 'startsWith', 'endsWith'] as const;
    case 'number':
      return ['equals', 'gt', 'lt', 'gte', 'lte', 'between'] as const;
    case 'date':
      return ['equals', 'gt', 'lt', 'between'] as const;
    case 'boolean':
      return ['equals'] as const;
    case 'enum':
      return ['equals', 'in'] as const;
    default:
      return [];
  }
}
