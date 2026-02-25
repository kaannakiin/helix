import { BadRequestException } from '@nestjs/common';
import type { FieldFilterConfig } from '@org/types/data-query';
import type {
  RuleCondition,
  RuleGroup,
  RuleTargetEntity,
} from '@org/types/rule-engine';
import { RULE_TARGET_FIELD_CONFIGS, isRuleGroup } from '@org/types/rule-engine';

export function validateRuleTreeFields(
  targetEntity: RuleTargetEntity,
  conditions: RuleGroup
): void {
  const fieldConfig = RULE_TARGET_FIELD_CONFIGS[targetEntity];
  const errors: string[] = [];

  function walk(item: RuleCondition | RuleGroup): void {
    if (isRuleGroup(item)) {
      item.conditions.forEach(walk);
      return;
    }

    const config: FieldFilterConfig | undefined = fieldConfig[item.field];
    if (!config) {
      errors.push(`Unknown field "${item.field}" for entity "${targetEntity}"`);
      return;
    }
    if (config.filterType !== item.filterType) {
      errors.push(
        `Field "${item.field}" expects filterType "${config.filterType}" but got "${item.filterType}"`
      );
    }
    if (
      config.filterType === 'enum' &&
      config.values &&
      item.filterType === 'enum'
    ) {
      const values = Array.isArray(item.value) ? item.value : [item.value];
      for (const v of values) {
        if (!config.values.includes(v)) {
          errors.push(
            `Field "${
              item.field
            }" does not allow value "${v}". Allowed: ${config.values.join(
              ', '
            )}`
          );
        }
      }
    }
  }

  walk(conditions);

  if (errors.length > 0) {
    throw new BadRequestException({
      message: 'Invalid rule tree conditions',
      errors,
    });
  }
}
