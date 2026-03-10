import { createHash } from 'crypto';
import {
  CATALOG_BRAND_SLUG_PREFIX,
  CATALOG_CATEGORY_SLUG_PREFIX,
  CATALOG_IMAGE_HOST,
  CATALOG_PRODUCT_SLUG_PREFIX,
  CATALOG_TAG_GROUP_SLUG_PREFIX,
  CATALOG_TAG_SLUG_PREFIX,
  CATALOG_VARIANT_GROUP_SLUG_PREFIX,
  CATALOG_VARIANT_OPTION_SLUG_PREFIX,
} from './catalog-seed.config.js';

type SeedSlugKind =
  | 'brand'
  | 'category'
  | 'tag-group'
  | 'tag'
  | 'variant-group'
  | 'variant-option'
  | 'product';

const SLUG_PREFIX_BY_KIND: Record<SeedSlugKind, string> = {
  brand: CATALOG_BRAND_SLUG_PREFIX,
  category: CATALOG_CATEGORY_SLUG_PREFIX,
  'tag-group': CATALOG_TAG_GROUP_SLUG_PREFIX,
  tag: CATALOG_TAG_SLUG_PREFIX,
  'variant-group': CATALOG_VARIANT_GROUP_SLUG_PREFIX,
  'variant-option': CATALOG_VARIANT_OPTION_SLUG_PREFIX,
  product: CATALOG_PRODUCT_SLUG_PREFIX,
};

export interface SeedTranslationInput {
  name: string;
  description?: string;
  shortDescription?: string;
  metaTitle?: string;
  metaDescription?: string;
  slug?: string;
}

export interface SeedTranslationRecord extends SeedTranslationInput {
  locale: 'EN' | 'TR';
}

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'c')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function makeSeedSlug(kind: SeedSlugKind, baseSlug: string): string {
  return `${SLUG_PREFIX_BY_KIND[kind]}${slugify(baseSlug)}`;
}

export function makeSeedTranslations(
  en: SeedTranslationInput,
  tr: SeedTranslationInput,
): SeedTranslationRecord[] {
  return [
    { locale: 'EN', ...en },
    { locale: 'TR', ...tr },
  ];
}

export function makeImageUrl(
  scope: string,
  slug: string,
  width: number,
  height: number,
): string {
  const safeScope = scope.split('/').map((part) => slugify(part)).join('/');
  return `${CATALOG_IMAGE_HOST}/${safeScope}/${slugify(slug)}-${width}x${height}.jpg`;
}

export function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) {
    return [[]];
  }

  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((left) => curr.map((right) => [...left, right])),
    [[]],
  );
}

export function rotateSlice<T>(
  items: T[],
  offset: number,
  count: number,
): T[] {
  if (items.length === 0 || count <= 0) {
    return [];
  }

  const safeCount = Math.min(count, items.length);
  const result: T[] = [];

  for (let index = 0; index < safeCount; index++) {
    result.push(items[(offset + index) % items.length]);
  }

  return result;
}

export function hashToInt(input: string): number {
  const digest = createHash('sha256').update(input).digest('hex');
  return Number.parseInt(digest.slice(0, 8), 16);
}

export function buildSku(productSlug: string, optionSlugs: string[]): string {
  const base = slugify(productSlug).toUpperCase();
  const suffix = optionSlugs.map((slug) => slugify(slug).toUpperCase()).join('-');
  return (suffix ? `${base}-${suffix}` : base).slice(0, 64);
}

export function buildEan13Barcode(seed: string): string {
  const numeric = createHash('sha256')
    .update(seed)
    .digest('hex')
    .replace(/[a-f]/g, '')
    .slice(0, 12)
    .padEnd(12, '7');

  let sum = 0;
  for (let index = 0; index < 12; index++) {
    const digit = Number(numeric[index]);
    sum += index % 2 === 0 ? digit : digit * 3;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return `${numeric}${checkDigit}`;
}

export function resolveProductStatus(index: number): 'ACTIVE' | 'DRAFT' | 'ARCHIVED' {
  const bucket = index % 20;
  if (bucket <= 14) {
    return 'ACTIVE';
  }
  if (bucket <= 18) {
    return 'DRAFT';
  }
  return 'ARCHIVED';
}

export function resolveStoreVisibility(index: number): string[] {
  const bucket = index % 10;
  if (bucket <= 5) {
    return ['helix-magaza', 'helix-toptan'];
  }
  if (bucket <= 7) {
    return ['helix-magaza'];
  }
  return ['helix-toptan'];
}

export function resolveImageCount(index: number, min = 1, max = 4): number {
  const range = Math.max(1, max - min + 1);
  return min + (index % range);
}

export function buildEditionLabel(index: number): {
  suffixEn: string;
  suffixTr: string;
  slugSuffix: string;
} {
  const edition = index + 1;
  return {
    suffixEn: `Drop ${edition}`,
    suffixTr: `Drop ${edition}`,
    slugSuffix: `drop-${edition}`,
  };
}

export function compact<T>(items: Array<T | null | undefined | false>): T[] {
  return items.filter(Boolean) as T[];
}

