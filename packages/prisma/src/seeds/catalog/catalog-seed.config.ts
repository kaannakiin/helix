export const CATALOG_SEED_NAMESPACE = 'catalog';

export const CATALOG_BRAND_SLUG_PREFIX = 'catalog-brand-';
export const CATALOG_CATEGORY_SLUG_PREFIX = 'catalog-category-';
export const CATALOG_TAG_GROUP_SLUG_PREFIX = 'catalog-tag-group-';
export const CATALOG_TAG_SLUG_PREFIX = 'catalog-tag-';
export const CATALOG_VARIANT_GROUP_SLUG_PREFIX = 'catalog-variant-group-';
export const CATALOG_VARIANT_OPTION_SLUG_PREFIX = 'catalog-variant-option-';
export const CATALOG_PRODUCT_SLUG_PREFIX = 'catalog-product-';

export const CATALOG_PRODUCT_MIN_COUNT = 150;
export const CATALOG_PRODUCT_DEFAULT_COUNT = 180;
export const CATALOG_PRODUCT_BULK_COUNT = 300;

export const CATALOG_STORE_SLUGS = ['helix-magaza', 'helix-toptan'] as const;

export const CATALOG_IMAGE_HOST = 'https://cdn.seed.helix.test';

export function resolveCatalogSeedCount(rawValue?: string): number {
  if (!rawValue) {
    return CATALOG_PRODUCT_DEFAULT_COUNT;
  }

  const parsedValue = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsedValue)) {
    return CATALOG_PRODUCT_DEFAULT_COUNT;
  }

  return Math.max(parsedValue, CATALOG_PRODUCT_MIN_COUNT);
}

