import { createId } from '@paralleldrive/cuid2';
import type { ProductVariantInputType } from '@org/schemas/admin/products';
import {
  generateEan13Barcode,
  generateSku,
} from '@org/utils/products/sku-barcode-generator';

/**
 * Minimal snapshot of a variant group for combination generation.
 * Only captures group ID and its option IDs — no names, translations, etc.
 */
export interface VariantGroupSnapshot {
  groupId: string;
  optionIds: string[];
}

/**
 * Extract group snapshots from form-level variantGroups data.
 */
export function extractGroupSnapshots(
  variantGroups: Array<{ uniqueId: string; options: Array<{ uniqueId: string }> }>
): VariantGroupSnapshot[] {
  return variantGroups.map((g) => ({
    groupId: g.uniqueId,
    optionIds: g.options.map((o) => o.uniqueId),
  }));
}

/**
 * Compute the cartesian product of option IDs across groups.
 * Returns an array of option-ID tuples, one entry per group.
 *
 * Example: groups = [{optionIds:['a','b']}, {optionIds:['x','y']}]
 *  → [['a','x'], ['a','y'], ['b','x'], ['b','y']]
 */
export function cartesianProduct(
  groups: VariantGroupSnapshot[]
): string[][] {
  if (groups.length === 0) return [];

  let result: string[][] = groups[0].optionIds.map((id) => [id]);

  for (let i = 1; i < groups.length; i++) {
    const next: string[][] = [];
    for (const existing of result) {
      for (const optId of groups[i].optionIds) {
        next.push([...existing, optId]);
      }
    }
    result = next;
  }

  return result;
}

/**
 * Compute a unique key from a set of option value IDs.
 * IDs are sorted alphabetically and joined with '|'.
 */
export function computeUniqueKey(optionValueIds: string[]): string {
  return [...optionValueIds].sort().join('|');
}

/**
 * Context for auto-generating SKU and barcode when creating new variants.
 */
export interface AutoGenerateContext {
  productSlug: string;
  /** Map from option uniqueId → option slug (for SKU generation) */
  optionSlugMap: Map<string, string>;
}

/**
 * Create a default variant entry for a new combination.
 */
export function createDefaultVariant(
  optionValueIds: string[],
  sortOrder: number,
  autoGenerate?: AutoGenerateContext
): ProductVariantInputType {
  let sku = '';
  const barcode = generateEan13Barcode();

  if (autoGenerate) {
    const optionSlugs = optionValueIds.map(
      (id) => autoGenerate.optionSlugMap.get(id) ?? ''
    );
    sku = generateSku({ productSlug: autoGenerate.productSlug, optionSlugs });
  }

  return {
    uniqueId: createId(),
    uniqueKey: computeUniqueKey(optionValueIds),
    optionValueIds,
    sku,
    barcode,
    isActive: true,
    trackingStrategy: 'NONE',
    sortOrder,
    newImages: [],
    existingImages: [],
  };
}

/**
 * Smart variant recalculation.
 *
 * Given the current variant groups (with their options) and the existing
 * variants array, produces a new variants array that:
 *  - Generates all cartesian-product combinations of the current groups
 *  - Preserves user data (SKU, barcode, isActive, trackingStrategy, images)
 *    from existing variants that match the new combinations
 *  - Handles group removal via "reduced key" matching: strips removed option
 *    IDs from old variants and matches against new combinations
 *  - For exact matches, preserves the original variant ID (React form identity)
 *  - For reduced matches (group removed causing collapse), generates a new ID
 */
export function recalculateVariants(
  groups: VariantGroupSnapshot[],
  existingVariants: ProductVariantInputType[],
  autoGenerate?: AutoGenerateContext
): ProductVariantInputType[] {
  if (groups.length === 0) return [];

  // 1. Collect all currently valid option IDs
  const validOptionIds = new Set<string>();
  for (const group of groups) {
    for (const optId of group.optionIds) {
      validOptionIds.add(optId);
    }
  }

  // 2. Build lookup maps from existing variants
  const exactMap = new Map<string, ProductVariantInputType>();
  const reducedMap = new Map<string, ProductVariantInputType>();

  // Sort by sortOrder so that when collapsing, the first (lowest sortOrder) wins
  const sorted = [...existingVariants].sort(
    (a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)
  );

  for (const variant of sorted) {
    // Exact match map
    exactMap.set(variant.uniqueKey, variant);

    // Reduced key: keep only option IDs that are still valid
    const reducedIds = variant.optionValueIds.filter((id) =>
      validOptionIds.has(id)
    );
    if (reducedIds.length > 0) {
      const reducedKey = computeUniqueKey(reducedIds);
      // Only store the first match (lowest sortOrder) per reduced key
      if (!reducedMap.has(reducedKey)) {
        reducedMap.set(reducedKey, variant);
      }
    }
  }

  // 3. Generate cartesian product of current groups
  const combinations = cartesianProduct(groups);

  // 4. Build result with smart matching
  const result: ProductVariantInputType[] = [];

  for (let i = 0; i < combinations.length; i++) {
    const combo = combinations[i];
    const newUniqueKey = computeUniqueKey(combo);

    const exactMatch = exactMap.get(newUniqueKey);
    const reducedMatch = !exactMatch
      ? reducedMap.get(newUniqueKey)
      : undefined;
    const matched = exactMatch ?? reducedMatch;

    if (matched) {
      result.push({
        uniqueId: exactMatch ? matched.uniqueId : createId(),
        uniqueKey: newUniqueKey,
        optionValueIds: combo,
        sku: matched.sku,
        barcode: matched.barcode,
        isActive: matched.isActive,
        trackingStrategy: matched.trackingStrategy,
        sortOrder: i,
        newImages: matched.newImages ?? [],
        existingImages: matched.existingImages ?? [],
      });
    } else {
      result.push(createDefaultVariant(combo, i, autoGenerate));
    }
  }

  return result;
}
