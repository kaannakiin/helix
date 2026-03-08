import type { ProductVariantInputType } from '@org/schemas/admin/products';
import {
  generateEan13Barcode,
  generateSku,
} from '@org/utils/products/sku-barcode-generator';
import { createId } from '@paralleldrive/cuid2';

export interface VariantGroupSnapshot {
  groupId: string;
  optionIds: string[];
}

export function extractGroupSnapshots(
  variantGroups: Array<{
    uniqueId: string;
    options: Array<{ uniqueId: string }>;
  }>
): VariantGroupSnapshot[] {
  return variantGroups.map((g) => ({
    groupId: g.uniqueId,
    optionIds: g.options.map((o) => o.uniqueId),
  }));
}

export function cartesianProduct(groups: VariantGroupSnapshot[]): string[][] {
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

export function computeUniqueKey(optionValueIds: string[]): string {
  return [...optionValueIds].sort().join('|');
}

export interface AutoGenerateContext {
  productSlug: string;
  optionSlugMap: Map<string, string>;
}

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

export function recalculateVariants(
  groups: VariantGroupSnapshot[],
  existingVariants: ProductVariantInputType[],
  autoGenerate?: AutoGenerateContext
): ProductVariantInputType[] {
  if (groups.length === 0) return [];

  const validOptionIds = new Set<string>();
  for (const group of groups) {
    for (const optId of group.optionIds) {
      validOptionIds.add(optId);
    }
  }

  const exactMap = new Map<string, ProductVariantInputType>();
  const reducedMap = new Map<string, ProductVariantInputType>();

  const sorted = [...existingVariants].sort(
    (a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)
  );

  for (const variant of sorted) {
    exactMap.set(variant.uniqueKey, variant);

    const reducedIds = variant.optionValueIds.filter((id) =>
      validOptionIds.has(id)
    );
    if (reducedIds.length > 0) {
      const reducedKey = computeUniqueKey(reducedIds);

      if (!reducedMap.has(reducedKey)) {
        reducedMap.set(reducedKey, variant);
      }
    }
  }

  const combinations = cartesianProduct(groups);

  const result: ProductVariantInputType[] = [];

  for (let i = 0; i < combinations.length; i++) {
    const combo = combinations[i];
    const newUniqueKey = computeUniqueKey(combo);

    const exactMatch = exactMap.get(newUniqueKey);
    const reducedMatch = !exactMatch ? reducedMap.get(newUniqueKey) : undefined;
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
