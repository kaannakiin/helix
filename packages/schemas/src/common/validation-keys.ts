export const V = {
  // ── Auth ──
  EMAIL_INVALID: 'validation.errors.auth.email_invalid',
  PHONE_REQUIRED: 'validation.errors.auth.phone_required',
  PHONE_INVALID: 'validation.errors.auth.phone_invalid',
  PASSWORD_REQUIRED: 'validation.errors.auth.password_required',
  PASSWORD_MIN: 'validation.errors.auth.password_min',
  PASSWORD_MAX: 'validation.errors.auth.password_max',
  NAME_MIN: 'validation.errors.auth.name_min',
  NAME_MAX: 'validation.errors.auth.name_max',
  SURNAME_MIN: 'validation.errors.auth.surname_min',
  SURNAME_MAX: 'validation.errors.auth.surname_max',
  PASSWORDS_NOT_MATCH: 'validation.errors.auth.passwords_not_match',
  EMAIL_OR_PHONE_REQUIRED: 'validation.errors.auth.email_or_phone_required',

  // ── Common ──
  REQUIRED: 'validation.errors.common.required',
  LOCALE_REQUIRED: 'validation.errors.common.locale_required',
  NAME_REQUIRED: 'validation.errors.common.name_required',
  TRANSLATIONS_MIN: 'validation.errors.common.translations_min',
  SLUG_PATTERN: 'validation.errors.common.slug_pattern',
  DOMAIN_INVALID: 'validation.errors.common.domain_invalid',
  HOSTNAME_INVALID: 'validation.errors.common.hostname_invalid',
  IPV4_INVALID: 'validation.errors.common.ipv4_invalid',
  IPV6_INVALID: 'validation.errors.common.ipv6_invalid',
  INGRESS_TARGET_REQUIRED: 'validation.errors.common.ingress_target_required',

  // ── Duplicates ──
  DUPLICATE_LOCALE: 'validation.errors.common.duplicate_locale',
  DUPLICATE_SLUG: 'validation.errors.common.duplicate_slug',
  DUPLICATE_NAME_IN_LOCALE: 'validation.errors.common.duplicate_name_in_locale',
  DUPLICATE_CATEGORY: 'validation.errors.common.duplicate_category',
  DUPLICATE_VARIANT_GROUP: 'validation.errors.common.duplicate_variant_group',
  DUPLICATE_VARIANT_COMBINATION:
    'validation.errors.common.duplicate_variant_combination',
  DUPLICATE_SKU: 'validation.errors.common.duplicate_sku',

  // ── Files ──
  FILES_TOO_MANY: 'validation.errors.common.files_too_many',

  // ── Variants ──
  VARIANT_OPTIONS_MIN: 'validation.errors.common.variant_options_min',
  VARIANT_UNIQUE_KEY_REQUIRED:
    'validation.errors.common.variant_unique_key_required',
  VARIANT_OPTION_VALUES_MIN:
    'validation.errors.common.variant_option_values_min',
  VARIANT_OPTION_COUNT_MISMATCH:
    'validation.errors.common.variant_option_count_mismatch',
  VARIANT_OPTION_INVALID: 'validation.errors.common.variant_option_invalid',
  VARIANT_MISSING_GROUP_OPTION:
    'validation.errors.common.variant_missing_group_option',
  VARIANT_UNIQUE_KEY_MISMATCH:
    'validation.errors.common.variant_unique_key_mismatch',
  VARIANT_GROUPS_REQUIRED: 'validation.errors.common.variant_groups_required',
  VARIANT_GROUPS_NOT_ALLOWED:
    'validation.errors.common.variant_groups_not_allowed',
  VARIANTS_REQUIRED: 'validation.errors.common.variants_required',
  VARIANTS_NOT_ALLOWED: 'validation.errors.common.variants_not_allowed',
  MULTIPLE_COLOR_GROUPS: 'validation.errors.common.multiple_color_groups',

  // ── Products ──
  PRODUCT_TYPE_REQUIRED: 'validation.errors.common.product_type_required',
  PRODUCT_STATUS_REQUIRED: 'validation.errors.common.product_status_required',
  TRACKING_STRATEGY_REQUIRED:
    'validation.errors.common.tracking_strategy_required',

  // ── Pricing ──
  PRICE_LIST_NAME_REQUIRED: 'validation.errors.common.price_list_name_required',
  PRICE_LIST_CURRENCY_REQUIRED:
    'validation.errors.common.price_list_currency_required',
  PRICE_REQUIRED: 'validation.errors.common.price_required',
  PRICE_NONNEGATIVE: 'validation.errors.common.price_nonnegative',
  DUPLICATE_VARIANT_PRICE: 'validation.errors.common.duplicate_variant_price',

  // ── Customer Groups ──
  CUSTOMER_GROUP_NAME_REQUIRED:
    'validation.errors.common.customer_group_name_required',
  CUSTOMER_GROUP_TYPE_REQUIRED:
    'validation.errors.common.customer_group_type_required',
  CUSTOMER_GROUP_RULE_TREE_REQUIRED:
    'validation.errors.common.customer_group_rule_tree_required',
  CUSTOMER_GROUP_MEMBERS_MIN:
    'validation.errors.common.customer_group_members_min',
  CRON_EXPRESSION_INVALID: 'validation.errors.common.cron_expression_invalid',

  // ── Decision Tree ──
  DECISION_TREE_ROOT_REQUIRED:
    'validation.errors.common.decision_tree_root_required',
  DECISION_TREE_NODES_MIN: 'validation.errors.common.decision_tree_nodes_min',
  DECISION_TREE_ROOT_NOT_FOUND:
    'validation.errors.common.decision_tree_root_not_found',
  DECISION_TREE_INVALID_BRANCH_REF:
    'validation.errors.common.decision_tree_invalid_branch_ref',
  DECISION_TREE_ORPHAN_NODE:
    'validation.errors.common.decision_tree_orphan_node',
  DECISION_TREE_MIN_CONDITIONS:
    'validation.errors.common.decision_tree_min_conditions',
  DECISION_TREE_SIMPLE_MULTIPLE_RESULTS:
    'validation.errors.common.decision_tree_simple_multiple_results',
  DECISION_TREE_SIMPLE_NO_BRANCH_NOT_ALLOWED:
    'validation.errors.common.decision_tree_simple_no_branch_not_allowed',

  // ── Condition Set ──
  CONDITION_SET_MIN_CONDITIONS:
    'validation.errors.common.condition_set_min_conditions',

  // Store
  ACTIVE_STORES_REQUIRED: 'validation.errors.common.active_stores_required',
  DUPLICATE_STORE: 'validation.errors.common.duplicate_store',
  TIMEZONE_INVALID: 'validation.errors.common.timezone_invalid',
} as const;
