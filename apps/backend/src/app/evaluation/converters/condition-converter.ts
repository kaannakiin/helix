import type { RuleCondition } from '@org/types/rule-engine';
import {
  booleanToPrisma,
  dateToPrisma,
  enumToPrisma,
  numberToPrisma,
  textToPrisma,
} from '../../../core/utils/prisma-query-builder';

export function ruleConditionToPrisma(
  condition: RuleCondition
): Record<string, unknown> {
  const { field } = condition;
  let prismaFilter: Record<string, unknown>;

  switch (condition.filterType) {
    case 'text':
      prismaFilter = textToPrisma(condition.op, condition.value);
      break;
    case 'number':
      prismaFilter = numberToPrisma(
        condition.op,
        condition.value,
        condition.valueTo
      );
      break;
    case 'date':
      prismaFilter = dateToPrisma(
        condition.op,
        condition.value,
        condition.valueTo
      );
      break;
    case 'boolean':
      prismaFilter = booleanToPrisma(condition.value);
      break;
    case 'enum':
      prismaFilter = enumToPrisma(condition.op, condition.value);
      break;
  }

  return { [field]: prismaFilter };
}
