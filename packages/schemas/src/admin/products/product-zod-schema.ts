import {
  FileType,
  Locale,
  ProductStatus,
  ProductType,
  TrackingStrategy,
  VariantGroupType,
} from '@org/prisma/browser';
import { createId } from '@paralleldrive/cuid2';
import { z } from 'zod';
import {
  cuidSchema,
  dropzoneFileSchema,
  existingImageSchema,
  findDuplicates,
  metaDescriptionSchema,
  metaTitleSchema,
  slugSchema,
  sortOrderSchema,
} from '../../common/common-schemas.js';
import { V } from '../../common/validation-keys.js';
import {
  BackendVariantGroupSchema,
  VariantGroupSchema,
  variantGroupDisplayModeSchema,
} from '../variants/variant-group-zod-schema.js';

const productVariantGroupSchema = VariantGroupSchema.safeExtend({
  displayMode: variantGroupDisplayModeSchema.nullable().default(null),
});

const backendProductVariantGroupSchema = BackendVariantGroupSchema.safeExtend({
  displayMode: variantGroupDisplayModeSchema.nullable().default(null),
});

export const ProductTranslationSchema = z.object({
  locale: z.enum(Locale, { error: V.LOCALE_REQUIRED }),
  name: z
    .string({ error: V.NAME_REQUIRED })
    .trim()
    .min(1, { error: V.NAME_REQUIRED }),
  slug: slugSchema,
  shortDescription: z.string().nullish(),
  description: z.string().nullish(),
  metaTitle: metaTitleSchema.nullish(),
  metaDescription: metaDescriptionSchema.nullish(),
});

const productCategorySchema = z.object({
  categoryId: cuidSchema,
  sortOrder: sortOrderSchema,
});

export const productVariantSchema = z.object({
  uniqueId: z.cuid2(),
  uniqueKey: z.string().min(1, { error: V.VARIANT_UNIQUE_KEY_REQUIRED }),
  optionValueIds: z
    .array(cuidSchema)
    .min(1, { error: V.VARIANT_OPTION_VALUES_MIN }),
  sku: z.string().max(128).optional().or(z.literal('')),
  barcode: z.string().max(128).optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  trackingStrategy: z
    .enum(TrackingStrategy, { error: V.TRACKING_STRATEGY_REQUIRED })
    .default('NONE'),
  sortOrder: sortOrderSchema,
  newImages: dropzoneFileSchema({
    maxFiles: 10,
    allowedTypes: [FileType.IMAGE, FileType.VIDEO],
    required: false,
  }),
  existingImages: z.array(existingImageSchema).default([]),
});

export const backendProductVariantSchema = z.object({
  uniqueId: z.cuid2(),
  uniqueKey: z.string().min(1, { error: V.VARIANT_UNIQUE_KEY_REQUIRED }),
  optionValueIds: z
    .array(cuidSchema)
    .min(1, { error: V.VARIANT_OPTION_VALUES_MIN }),
  sku: z.string().max(128).optional().or(z.literal('')),
  barcode: z.string().max(128).optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  trackingStrategy: z
    .enum(TrackingStrategy, { error: V.TRACKING_STRATEGY_REQUIRED })
    .default('NONE'),
  sortOrder: sortOrderSchema,
  existingImages: z.array(existingImageSchema).default([]),
});

type SharedCheckCtx = {
  issues: z.core.$ZodRawIssue[];
  value: {
    translations: Array<{ locale: string }>;
    hasVariants: boolean;
    variantGroups: Array<{
      uniqueId: string;
      type: string;
      options: Array<{ uniqueId: string }>;
    }>;
    variants: Array<{
      uniqueId: string;
      uniqueKey: string;
      optionValueIds: string[];
      sku?: string | undefined;
    }>;
    categories: Array<{ categoryId: string }>;
  };
};

function checkDuplicateLocales({ issues, value }: SharedCheckCtx) {
  const dupes = findDuplicates(value.translations, (t) => t.locale);
  for (const dupe of dupes) {
    issues.push({
      code: 'custom',
      input: value.translations[dupe.index].locale,
      error: V.DUPLICATE_LOCALE,
      path: ['translations', dupe.index, 'locale'],
    });
  }
}

function checkVariantIntegrity({ issues, value }: SharedCheckCtx) {
  if (!value.hasVariants) {
    if (value.variantGroups.length > 0) {
      issues.push({
        code: 'custom',
        input: value.variantGroups,
        error: V.VARIANT_GROUPS_NOT_ALLOWED,
        path: ['variantGroups'],
      });
    }
    if (value.variants.length > 0) {
      issues.push({
        code: 'custom',
        input: value.variants,
        error: V.VARIANTS_NOT_ALLOWED,
        path: ['variants'],
      });
    }
    return;
  }

  if (value.variantGroups.length === 0) {
    issues.push({
      code: 'custom',
      input: value.variantGroups,
      error: V.VARIANT_GROUPS_REQUIRED,
      path: ['variantGroups'],
    });
    return;
  }

  const colorGroupCount = value.variantGroups.filter(
    (g) => g.type === VariantGroupType.COLOR
  ).length;
  if (colorGroupCount > 1) {
    issues.push({
      code: 'custom',
      input: value.variantGroups,
      error: V.MULTIPLE_COLOR_GROUPS,
      path: ['variantGroups'],
    });
  }

  if (value.variants.length === 0) {
    issues.push({
      code: 'custom',
      input: value.variants,
      error: V.VARIANTS_REQUIRED,
      path: ['variants'],
    });
    return;
  }

  const optionToGroup = new Map<string, string>();
  for (const group of value.variantGroups) {
    for (const opt of group.options) {
      optionToGroup.set(opt.uniqueId, group.uniqueId);
    }
  }

  const validOptionIds = new Set(optionToGroup.keys());
  const groupCount = value.variantGroups.length;

  for (let i = 0; i < value.variants.length; i++) {
    const variant = value.variants[i];

    if (variant.optionValueIds.length !== groupCount) {
      issues.push({
        code: 'custom',
        input: variant.optionValueIds,
        error: V.VARIANT_OPTION_COUNT_MISMATCH,
        path: ['variants', i, 'optionValueIds'],
      });
      continue;
    }

    const seenGroups = new Set<string>();
    for (let j = 0; j < variant.optionValueIds.length; j++) {
      const optId = variant.optionValueIds[j];

      if (!validOptionIds.has(optId)) {
        issues.push({
          code: 'custom',
          input: optId,
          error: V.VARIANT_OPTION_INVALID,
          path: ['variants', i, 'optionValueIds', j],
        });
        continue;
      }

      const groupId = optionToGroup.get(optId) as string;
      if (seenGroups.has(groupId)) {
        issues.push({
          code: 'custom',
          input: variant.optionValueIds,
          error: V.VARIANT_MISSING_GROUP_OPTION,
          path: ['variants', i, 'optionValueIds'],
        });
      }
      seenGroups.add(groupId);
    }

    const expectedKey = [...variant.optionValueIds].sort().join('|');
    if (variant.uniqueKey !== expectedKey) {
      issues.push({
        code: 'custom',
        input: variant.uniqueKey,
        error: V.VARIANT_UNIQUE_KEY_MISMATCH,
        path: ['variants', i, 'uniqueKey'],
      });
    }
  }
}

function checkDuplicates({ issues, value }: SharedCheckCtx) {
  const groupDupes = findDuplicates(value.variantGroups, (g) => g.uniqueId);
  for (const dupe of groupDupes) {
    issues.push({
      code: 'custom',
      input: value.variantGroups[dupe.index].uniqueId,
      error: V.DUPLICATE_VARIANT_GROUP,
      path: ['variantGroups', dupe.index, 'uniqueId'],
    });
  }

  const keyDupes = findDuplicates(value.variants, (v) => v.uniqueKey);
  for (const dupe of keyDupes) {
    issues.push({
      code: 'custom',
      input: value.variants[dupe.index].uniqueKey,
      error: V.DUPLICATE_VARIANT_COMBINATION,
      path: ['variants', dupe.index, 'uniqueKey'],
    });
  }

  const variantsWithSku = value.variants
    .map((v, idx) => ({ sku: v.sku, idx }))
    .filter((v) => v.sku && v.sku.length > 0);
  const skuDupes = findDuplicates(variantsWithSku, (v) => v.sku as string);
  for (const dupe of skuDupes) {
    issues.push({
      code: 'custom',
      input: variantsWithSku[dupe.index].sku,
      error: V.DUPLICATE_SKU,
      path: ['variants', variantsWithSku[dupe.index].idx, 'sku'],
    });
  }

  const catDupes = findDuplicates(value.categories, (c) => c.categoryId);
  for (const dupe of catDupes) {
    issues.push({
      code: 'custom',
      input: value.categories[dupe.index].categoryId,
      error: V.DUPLICATE_CATEGORY,
      path: ['categories', dupe.index, 'categoryId'],
    });
  }
}

const productSchemaShape = z.object({
  uniqueId: z.cuid2(),
  type: z
    .enum(ProductType, { error: V.PRODUCT_TYPE_REQUIRED })
    .default('PHYSICAL'),
  status: z
    .enum(ProductStatus, { error: V.PRODUCT_STATUS_REQUIRED })
    .default('DRAFT'),
  hasVariants: z.boolean().default(false),
  brandId: cuidSchema.optional().or(z.literal('')),
  googleTaxonomyId: z.number().int().nullish().default(null),
  translations: z
    .array(ProductTranslationSchema)
    .min(1, { error: V.TRANSLATIONS_MIN }),
  newImages: dropzoneFileSchema({
    maxFiles: 10,
    allowedTypes: [FileType.IMAGE, FileType.VIDEO],
    required: false,
  }),
  existingImages: z.array(existingImageSchema).default([]),
  variantGroups: z.array(productVariantGroupSchema).default([]),
  variants: z.array(productVariantSchema).default([]),
  categories: z.array(productCategorySchema).default([]),
  tagIds: z.array(cuidSchema).default([]),
});

function checkImageCounts({
  issues,
  value,
}: {
  issues: z.core.$ZodRawIssue[];
  value: z.output<typeof productSchemaShape>;
}) {
  const productTotal =
    (value.newImages?.length ?? 0) + (value.existingImages?.length ?? 0);
  if (productTotal > 10) {
    issues.push({
      code: 'custom',
      input: value.newImages,
      error: V.FILES_TOO_MANY,
      path: ['newImages'],
    });
  }

  for (let i = 0; i < value.variants.length; i++) {
    const v = value.variants[i];
    const variantTotal =
      (v.newImages?.length ?? 0) + (v.existingImages?.length ?? 0);
    if (variantTotal > 10) {
      issues.push({
        code: 'custom',
        input: v.newImages,
        error: V.FILES_TOO_MANY,
        path: ['variants', i, 'newImages'],
      });
    }
  }
}

export const ProductSchema = productSchemaShape
  .check(checkDuplicateLocales)
  .check(checkImageCounts)
  .check(checkVariantIntegrity)
  .check(checkDuplicates);

const backendProductSchemaShape = z.object({
  uniqueId: z.cuid2(),
  type: z
    .enum(ProductType, { error: V.PRODUCT_TYPE_REQUIRED })
    .default('PHYSICAL'),
  status: z
    .enum(ProductStatus, { error: V.PRODUCT_STATUS_REQUIRED })
    .default('DRAFT'),
  hasVariants: z.boolean().default(false),
  brandId: cuidSchema.optional().or(z.literal('')),
  googleTaxonomyId: z.number().int().nullable().default(null),
  translations: z
    .array(ProductTranslationSchema)
    .min(1, { error: V.TRANSLATIONS_MIN }),
  existingImages: z.array(existingImageSchema).default([]),
  variantGroups: z.array(backendProductVariantGroupSchema).default([]),
  variants: z.array(backendProductVariantSchema).default([]),
  categories: z.array(productCategorySchema).default([]),
  tagIds: z.array(cuidSchema).default([]),
});

export const BackendProductSchema = backendProductSchemaShape
  .check(checkDuplicateLocales)
  .check(checkVariantIntegrity)
  .check(checkDuplicates);

export type ProductTranslationInputType = z.input<
  typeof ProductTranslationSchema
>;
export type ProductTranslationOutputType = z.output<
  typeof ProductTranslationSchema
>;

export type ProductVariantInputType = z.input<typeof productVariantSchema>;
export type ProductVariantOutputType = z.output<typeof productVariantSchema>;

export type ProductInputType = z.input<typeof ProductSchema>;
export type ProductOutputType = z.output<typeof ProductSchema>;

export const NEW_PRODUCT_DEFAULT_VALUES: ProductInputType = {
  uniqueId: createId(),
  type: 'PHYSICAL',
  status: 'DRAFT',
  hasVariants: false,
  googleTaxonomyId: null,
  translations: [{ locale: 'TR', name: '', slug: '' }],
  newImages: [],
  existingImages: [],
  variantGroups: [],
  variants: [],
  categories: [],
  tagIds: [],
};
