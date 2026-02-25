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
} as const;
