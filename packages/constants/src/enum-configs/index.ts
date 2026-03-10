import type {
  AccountStatus,
  AccountType,
  AdjustmentType,
  AssignmentTargetType,
  BusinessModel,
  CurrencyCode,
  CustomerGroupType,
  EvaluationJobStatus,
  EvaluationTrigger,
  PriceListStatus,
  PriceListType,
  PriceOriginType,
  ProductStatus,
  ProductType,
  RoundingRule,
  RuleTargetEntity,
  SourceSystem,
  StorefrontStatus,
  StoreStatus,
  TaxBehavior,
  TrackingStrategy,
  VariantGroupDisplayMode,
  VariantGroupType,
  WarehouseStatus,
} from '@org/prisma/client';

export interface EnumConfig {
  color: string;
  labelKey: string;
}

export type EnumOptionItem = { value: string; label: string };

export const AccountTypeConfigs: Record<AccountType, EnumConfig> = {
  PERSONAL: { color: 'blue', labelKey: 'accountType.PERSONAL' },
  BUSINESS: { color: 'teal', labelKey: 'accountType.BUSINESS' },
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

export const StoreStatusConfigs: Record<StoreStatus, EnumConfig> = {
  ACTIVE: { color: 'green', labelKey: 'storeStatus.ACTIVE' },
  INACTIVE: { color: 'gray', labelKey: 'storeStatus.INACTIVE' },
  SUSPENDED: { color: 'red', labelKey: 'storeStatus.SUSPENDED' },
};

export const BusinessModelConfigs: Record<BusinessModel, EnumConfig> = {
  B2C: { color: 'blue', labelKey: 'businessModel.B2C' },
  B2B: { color: 'violet', labelKey: 'businessModel.B2B' },
};

export const StorefrontStatusConfigs: Record<StorefrontStatus, EnumConfig> = {
  PENDING_HOST: {
    color: 'yellow',
    labelKey: 'storefrontStatus.PENDING_HOST',
  },
  ACTIVE: { color: 'green', labelKey: 'storefrontStatus.ACTIVE' },
  SUSPENDED: { color: 'red', labelKey: 'storefrontStatus.SUSPENDED' },
};

export const WarehouseStatusConfigs: Record<WarehouseStatus, EnumConfig> = {
  ACTIVE: { color: 'green', labelKey: 'warehouseStatus.ACTIVE' },
  INACTIVE: { color: 'gray', labelKey: 'warehouseStatus.INACTIVE' },
  MAINTENANCE: { color: 'orange', labelKey: 'warehouseStatus.MAINTENANCE' },
};

export const PriceListTypeConfigs: Record<PriceListType, EnumConfig> = {
  BASE: { color: 'blue', labelKey: 'priceListType.BASE' },
  SALE: { color: 'green', labelKey: 'priceListType.SALE' },
  CUSTOM: { color: 'violet', labelKey: 'priceListType.CUSTOM' },
  CONTRACT: { color: 'teal', labelKey: 'priceListType.CONTRACT' },
};

export const PriceListStatusConfigs: Record<PriceListStatus, EnumConfig> = {
  DRAFT: { color: 'gray', labelKey: 'priceListStatus.DRAFT' },
  ACTIVE: { color: 'green', labelKey: 'priceListStatus.ACTIVE' },
  ARCHIVED: { color: 'yellow', labelKey: 'priceListStatus.ARCHIVED' },
};

export const CurrencyCodeConfigs: Record<CurrencyCode, EnumConfig> = {
  TRY: { color: 'red', labelKey: 'currencyCode.TRY' },
  USD: { color: 'green', labelKey: 'currencyCode.USD' },
  EUR: { color: 'blue', labelKey: 'currencyCode.EUR' },
  GBP: { color: 'violet', labelKey: 'currencyCode.GBP' },
};

export const SourceSystemConfigs: Record<SourceSystem, EnumConfig> = {
  INTERNAL: { color: 'blue', labelKey: 'sourceSystem.INTERNAL' },
  SAP: { color: 'orange', labelKey: 'sourceSystem.SAP' },
  CANIAS: { color: 'teal', labelKey: 'sourceSystem.CANIAS' },
  WMS: { color: 'cyan', labelKey: 'sourceSystem.WMS' },
  API: { color: 'violet', labelKey: 'sourceSystem.API' },
  CSV_IMPORT: { color: 'yellow', labelKey: 'sourceSystem.CSV_IMPORT' },
  MANUAL_IMPORT: { color: 'gray', labelKey: 'sourceSystem.MANUAL_IMPORT' },
};

export const RoundingRuleConfigs: Record<RoundingRule, EnumConfig> = {
  NONE: { color: 'gray', labelKey: 'roundingRule.NONE' },
  ROUND_99: { color: 'blue', labelKey: 'roundingRule.ROUND_99' },
  ROUND_95: { color: 'teal', labelKey: 'roundingRule.ROUND_95' },
  ROUND_NEAREST: { color: 'green', labelKey: 'roundingRule.ROUND_NEAREST' },
  ROUND_UP: { color: 'orange', labelKey: 'roundingRule.ROUND_UP' },
  ROUND_DOWN: { color: 'red', labelKey: 'roundingRule.ROUND_DOWN' },
};

export const PriceOriginTypeConfigs: Record<PriceOriginType, EnumConfig> = {
  FIXED: { color: 'blue', labelKey: 'priceOriginType.FIXED' },
  RELATIVE: { color: 'orange', labelKey: 'priceOriginType.RELATIVE' },
};

export const AdjustmentTypeConfigs: Record<AdjustmentType, EnumConfig> = {
  PERCENTAGE: { color: 'violet', labelKey: 'adjustmentType.PERCENTAGE' },
  FIXED_AMOUNT: { color: 'cyan', labelKey: 'adjustmentType.FIXED_AMOUNT' },
};

export const TaxBehaviorConfigs: Record<TaxBehavior, EnumConfig> = {
  INCLUSIVE: { color: 'green', labelKey: 'taxBehavior.INCLUSIVE' },
  EXCLUSIVE: { color: 'yellow', labelKey: 'taxBehavior.EXCLUSIVE' },
  UNSPECIFIED: { color: 'gray', labelKey: 'taxBehavior.UNSPECIFIED' },
};

export const AssignmentTargetTypeConfigs: Record<
  AssignmentTargetType,
  EnumConfig
> = {
  ALL_CUSTOMERS: {
    color: 'blue',
    labelKey: 'assignmentTargetType.ALL_CUSTOMERS',
  },
  CUSTOMER_GROUP: {
    color: 'teal',
    labelKey: 'assignmentTargetType.CUSTOMER_GROUP',
  },
  ORGANIZATION: {
    color: 'violet',
    labelKey: 'assignmentTargetType.ORGANIZATION',
  },
  CUSTOMER: { color: 'orange', labelKey: 'assignmentTargetType.CUSTOMER' },
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
