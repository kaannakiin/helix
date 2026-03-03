import type {
  AccountStatus,
  CustomerGroupType,
  EvaluationJobStatus,
  EvaluationTrigger,
  ProductStatus,
  ProductType,
  RuleTargetEntity,
  TrackingStrategy,
  UserRole,
  VariantGroupDisplayMode,
  VariantGroupType,
} from '@org/prisma/client';

export interface EnumConfig {
  color: string;
  labelKey: string;
}

export type EnumOptionItem = { value: string; label: string };

export const UserRoleConfigs: Record<UserRole, EnumConfig> = {
  ADMIN: { color: 'red', labelKey: 'userRole.ADMIN' },
  MODERATOR: { color: 'orange', labelKey: 'userRole.MODERATOR' },
  USER: { color: 'blue', labelKey: 'userRole.USER' },
};

export const AccountStatusConfigs: Record<AccountStatus, EnumConfig> = {
  ACTIVE: { color: 'green', labelKey: 'accountStatus.ACTIVE' },
  SUSPENDED: { color: 'yellow', labelKey: 'accountStatus.SUSPENDED' },
  BANNED: { color: 'red', labelKey: 'accountStatus.BANNED' },
  DEACTIVATED: { color: 'gray', labelKey: 'accountStatus.DEACTIVATED' },
};

export const ProductStatusConfigs: Record<ProductStatus, EnumConfig> = {
  DRAFT: { color: 'gray', labelKey: 'productStatus.DRAFT' },
  ACTIVE: { color: 'green', labelKey: 'productStatus.ACTIVE' },
  ARCHIVED: { color: 'yellow', labelKey: 'productStatus.ARCHIVED' },
};

export const ProductTypeConfigs: Record<ProductType, EnumConfig> = {
  PHYSICAL: { color: 'blue', labelKey: 'productType.PHYSICAL' },
  DIGITAL: { color: 'violet', labelKey: 'productType.DIGITAL' },
};

export const VariantGroupTypeConfigs: Record<VariantGroupType, EnumConfig> = {
  COLOR: { color: 'pink', labelKey: 'variantGroupType.COLOR' },
  SIZE: { color: 'blue', labelKey: 'variantGroupType.SIZE' },
};

export const VariantGroupDisplayModeConfigs: Record<
  VariantGroupDisplayMode,
  EnumConfig
> = {
  BADGE: { color: 'violet', labelKey: 'variantGroupDisplayMode.BADGE' },
  SELECT: { color: 'blue', labelKey: 'variantGroupDisplayMode.SELECT' },
  IMAGE_GRID: {
    color: 'green',
    labelKey: 'variantGroupDisplayMode.IMAGE_GRID',
  },
};

export const CustomerGroupTypeConfigs: Record<CustomerGroupType, EnumConfig> = {
  MANUAL: { color: 'blue', labelKey: 'customerGroupType.MANUAL' },
  RULE_BASED: { color: 'violet', labelKey: 'customerGroupType.RULE_BASED' },
};

export const EvaluationJobStatusConfigs: Record<
  EvaluationJobStatus,
  EnumConfig
> = {
  PENDING: { color: 'yellow', labelKey: 'evaluationJobStatus.PENDING' },
  RUNNING: { color: 'blue', labelKey: 'evaluationJobStatus.RUNNING' },
  COMPLETED: { color: 'green', labelKey: 'evaluationJobStatus.COMPLETED' },
  FAILED: { color: 'red', labelKey: 'evaluationJobStatus.FAILED' },
  CANCELLED: { color: 'gray', labelKey: 'evaluationJobStatus.CANCELLED' },
};

export const EvaluationTriggerConfigs: Record<EvaluationTrigger, EnumConfig> = {
  SCHEDULED: { color: 'violet', labelKey: 'evaluationTrigger.SCHEDULED' },
  MANUAL: { color: 'teal', labelKey: 'evaluationTrigger.MANUAL' },
};

export const RuleTargetEntityConfigs: Record<RuleTargetEntity, EnumConfig> = {
  USER: { color: 'blue', labelKey: 'ruleTargetEntity.USER' },
  PRODUCT: { color: 'orange', labelKey: 'ruleTargetEntity.PRODUCT' },
  ORDER: { color: 'green', labelKey: 'ruleTargetEntity.ORDER' },
  INVENTORY: { color: 'cyan', labelKey: 'ruleTargetEntity.INVENTORY' },
};

export const TrackingStrategyConfigs: Record<TrackingStrategy, EnumConfig> = {
  NONE: { color: 'gray', labelKey: 'trackingStrategy.NONE' },
  BATCH: { color: 'blue', labelKey: 'trackingStrategy.BATCH' },
  SERIAL: { color: 'violet', labelKey: 'trackingStrategy.SERIAL' },
  BATCH_AND_SERIAL: {
    color: 'teal',
    labelKey: 'trackingStrategy.BATCH_AND_SERIAL',
  },
};

export function buildColorMap<K extends string>(
  configs: Record<K, EnumConfig>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, cfg] of Object.entries(configs) as [K, EnumConfig][]) {
    result[key] = cfg.color;
  }
  return result;
}

export function buildEnumOptions<K extends string>(
  configs: Record<K, EnumConfig>,
  t: (key: string) => string
): EnumOptionItem[] {
  return (Object.keys(configs) as K[]).map((value) => ({
    value,
    label: t(configs[value].labelKey),
  }));
}
