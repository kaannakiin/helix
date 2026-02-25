import type { ProductInputType } from '@org/schemas/admin/products';
import {
  extractGroupSnapshots,
  recalculateVariants,
  type AutoGenerateContext,
} from '@org/utils/products/variant-combinations';
import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';

/**
 * Computes a structural key from variant groups.
 * Only groups with at least one option (with a valid ID) are included.
 * Returns empty string if no valid groups exist.
 */
function computeStructuralKey(
  variantGroups: ProductInputType['variantGroups'] | undefined
): string {
  if (!variantGroups || variantGroups.length === 0) return '';

  const parts: string[] = [];
  for (const g of variantGroups) {
    const optionIds = (g.options ?? [])
      .filter((o) => !!o.uniqueId)
      .map((o) => o.uniqueId)
      .sort();
    if (optionIds.length > 0) {
      parts.push(`${g.uniqueId}:${optionIds.join(',')}`);
    }
  }
  return parts.join('|');
}

/**
 * Returns an imperative `recalculate` function that computes the cartesian
 * product of variant combinations from the current form state.
 *
 * Call `recalculate()` explicitly at commit points (drawer close, modal submit,
 * group add/remove) instead of watching the form reactively. This avoids
 * expensive re-renders on every keystroke inside drawers.
 */
export function useVariantCombinations() {
  const { getValues, setValue } = useFormContext<ProductInputType>();

  const recalculate = useCallback(() => {
    const hasVariants = getValues('hasVariants');
    if (!hasVariants) {
      setValue('variants', [], { shouldDirty: true, shouldValidate: false });
      return;
    }

    const variantGroups = getValues('variantGroups');
    const currentKey = computeStructuralKey(variantGroups);

    if (currentKey === '') {
      setValue('variants', [], { shouldDirty: true, shouldValidate: false });
      return;
    }

    const readyGroups = (variantGroups ?? []).filter(
      (g) =>
        g.options && g.options.length > 0 && g.options.every((o) => o.uniqueId)
    );

    if (readyGroups.length === 0) {
      setValue('variants', [], { shouldDirty: true, shouldValidate: false });
      return;
    }

    const snapshots = extractGroupSnapshots(readyGroups);
    const existingVariants = getValues('variants') ?? [];

    const productSlug = getValues('translations.0.slug') ?? '';
    const optionSlugMap = new Map<string, string>();
    for (const group of readyGroups) {
      for (const opt of group.options ?? []) {
        optionSlugMap.set(opt.uniqueId, opt.translations?.[0]?.slug ?? '');
      }
    }
    const autoGenerate: AutoGenerateContext = { productSlug, optionSlugMap };

    const newVariants = recalculateVariants(
      snapshots,
      existingVariants,
      autoGenerate
    );

    setValue('variants', newVariants, {
      shouldDirty: true,
      shouldValidate: false,
    });
  }, [getValues, setValue]);

  return { recalculate };
}
