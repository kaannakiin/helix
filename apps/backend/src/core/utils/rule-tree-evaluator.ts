import type { FilterCondition } from '@org/types/data-query';
import type { RuleCondition, RuleGroup } from '@org/types/rule-engine';
import { isRuleGroup } from '@org/types/rule-engine';
import { conditionToPrisma } from './prisma-condition-converters.js';

function ruleConditionToFilterCondition(rc: RuleCondition): FilterCondition {
  const { field, ...filterCondition } = rc;
  return filterCondition as FilterCondition;
}

function evaluateRuleItem(
  item: RuleCondition | RuleGroup
): Record<string, unknown> {
  if (isRuleGroup(item)) {
    return evaluateRuleGroup(item);
  }

  const prismaCondition = conditionToPrisma(
    ruleConditionToFilterCondition(item)
  );
  return { [item.field]: prismaCondition };
}

function evaluateRuleGroup(group: RuleGroup): Record<string, unknown> {
  const prismaKey = group.operator === 'AND' ? 'AND' : 'OR';
  const children = group.conditions.map(evaluateRuleItem);

  return {
    [prismaKey]: children,
  };
}

export function buildRuleTreePrismaWhere(
  ruleGroup: RuleGroup
): Record<string, unknown> {
  return evaluateRuleGroup(ruleGroup);
}
