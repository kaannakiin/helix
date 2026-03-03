import type { FieldFilterConfig } from '@org/types/data-query';
import type { RuleTargetEntity } from './index.js';
import { ADMIN_CUSTOMERS_FIELD_CONFIG } from '@org/types/admin/customers';

export const RULE_TARGET_FIELD_CONFIGS: Record<
  RuleTargetEntity,
  Record<string, FieldFilterConfig>
> = {
  USER: ADMIN_CUSTOMERS_FIELD_CONFIG,
  PRODUCT: {},
  ORDER: {},
  INVENTORY: {},
};
