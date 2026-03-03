import { createId } from '@paralleldrive/cuid2';
import {
  FileType,
  Locale,
  VariantGroupDisplayMode,
  VariantGroupType,
} from '@org/prisma/browser';
import { z } from 'zod';
import {
  dropzoneFileSchema,
  existingImageSchema,
  findDuplicates,
  hexColorSchema,
  slugSchema,
  sortOrderSchema,
} from '../../common/common-schemas.js';
import { V } from '../../common/validation-keys.js';

export const variantGroupTranslationSchema = z.object({
  locale: z.enum(Locale, { error: V.LOCALE_REQUIRED }),
  name: z
    .string({ error: V.NAME_REQUIRED })
    .trim()
    .min(1, { message: V.NAME_REQUIRED }),
  slug: slugSchema,
});

export const variantOptionTranslationSchema = z.object({
  locale: z.enum(Locale, { error: V.LOCALE_REQUIRED }),
  name: z
    .string({ error: V.NAME_REQUIRED })
    .trim()
    .min(1, { message: V.NAME_REQUIRED }),
  slug: slugSchema,
});

export const BaseVariantOptionCoreSchema = z.object({
  uniqueId: z.cuid2(),
  colorCode: hexColorSchema,
  sortOrder: sortOrderSchema,
  translations: z
    .array(variantOptionTranslationSchema)
    .min(1, { message: V.TRANSLATIONS_MIN }),
  existingImages: z.array(existingImageSchema).default([]),
});

export const BaseVariantOptionSchema = BaseVariantOptionCoreSchema.safeExtend({
  images: dropzoneFileSchema({
    maxFiles: 1,
    allowedTypes: [FileType.IMAGE],
    required: false,
  }),
});

export const BackendBaseVariantOptionSchema = BaseVariantOptionCoreSchema;

export const variantGroupTypeSchema = z.enum(VariantGroupType);
export const variantGroupDisplayModeSchema = z.enum(VariantGroupDisplayMode);

export function getDefaultDisplayMode(
  type: VariantGroupType
): VariantGroupDisplayMode {
  switch (type) {
    case VariantGroupType.COLOR:
      return VariantGroupDisplayMode.BADGE;
    default:
      return VariantGroupDisplayMode.SELECT;
  }
}

type VariantGroupCheckValue = {
  translations: Array<{ locale: string }>;
  options: Array<{
    uniqueId: string;
    translations: Array<{ locale: string; slug: string; name: string }>;
  }>;
};

const checkVariantGroup = ({
  issues,
  value,
}: {
  issues: z.core.$ZodRawIssue[];
  value: VariantGroupCheckValue;
}) => {
  const groupLocaleDupes = findDuplicates(value.translations, (t) => t.locale);
  for (const dupe of groupLocaleDupes) {
    issues.push({
      code: 'custom',
      input: value.translations[dupe.index].locale,
      message: V.DUPLICATE_LOCALE,
      path: ['translations', dupe.index, 'locale'],
    });
  }

  const slugsByLocale = new Map<string, Map<string, number>>();
  for (let optIdx = 0; optIdx < value.options.length; optIdx++) {
    const option = value.options[optIdx];
    for (let transIdx = 0; transIdx < option.translations.length; transIdx++) {
      const trans = option.translations[transIdx];
      const locale = trans.locale;
      const normalizedSlug = trans.slug.trim().toLowerCase();

      if (!slugsByLocale.has(locale)) {
        slugsByLocale.set(locale, new Map());
      }
      const localeSlugs = slugsByLocale.get(locale)!;

      if (localeSlugs.has(normalizedSlug)) {
        issues.push({
          code: 'custom',
          input: trans.slug,
          message: V.DUPLICATE_SLUG,
          path: ['options', optIdx, 'translations', transIdx, 'slug'],
        });
      } else {
        localeSlugs.set(normalizedSlug, optIdx);
      }
    }
  }

  const namesByLocale = new Map<string, Map<string, number>>();
  for (let optIdx = 0; optIdx < value.options.length; optIdx++) {
    const option = value.options[optIdx];
    for (let transIdx = 0; transIdx < option.translations.length; transIdx++) {
      const trans = option.translations[transIdx];
      const locale = trans.locale;
      const normalizedName = trans.name.trim().toLowerCase();

      if (!namesByLocale.has(locale)) {
        namesByLocale.set(locale, new Map());
      }
      const localeNames = namesByLocale.get(locale)!;

      if (localeNames.has(normalizedName)) {
        issues.push({
          code: 'custom',
          input: trans.name,
          message: V.DUPLICATE_NAME_IN_LOCALE,
          path: ['options', optIdx, 'translations', transIdx, 'name'],
        });
      } else {
        localeNames.set(normalizedName, optIdx);
      }
    }
  }

  for (let optIdx = 0; optIdx < value.options.length; optIdx++) {
    const optLocaleDupes = findDuplicates(
      value.options[optIdx].translations,
      (t) => t.locale
    );
    for (const dupe of optLocaleDupes) {
      issues.push({
        code: 'custom',
        input: value.options[optIdx].translations[dupe.index].locale,
        message: V.DUPLICATE_LOCALE,
        path: ['options', optIdx, 'translations', dupe.index, 'locale'],
      });
    }
  }
};

const variantGroupBaseShape = z.object({
  uniqueId: z.cuid2(),
  type: variantGroupTypeSchema.default(VariantGroupType.SIZE),
  sortOrder: sortOrderSchema,
  translations: z
    .array(variantGroupTranslationSchema)
    .min(1, { message: V.TRANSLATIONS_MIN }),
  options: z
    .array(BaseVariantOptionSchema)
    .min(1, { message: V.VARIANT_OPTIONS_MIN }),
});

export const VariantGroupSchema =
  variantGroupBaseShape.check(checkVariantGroup);

export const BackendVariantGroupSchema = z
  .object({
    uniqueId: z.cuid2(),
    type: variantGroupTypeSchema.default(VariantGroupType.SIZE),
    sortOrder: sortOrderSchema,
    translations: z
      .array(variantGroupTranslationSchema)
      .min(1, { message: V.TRANSLATIONS_MIN }),
    options: z
      .array(BackendBaseVariantOptionSchema)
      .min(1, { message: V.VARIANT_OPTIONS_MIN }),
  })
  .check(checkVariantGroup);

export type BaseVariantOptionInput = z.input<typeof BaseVariantOptionSchema>;
export type BaseVariantOptionOutput = z.output<typeof BaseVariantOptionSchema>;
export type VariantGroupInput = z.input<typeof VariantGroupSchema>;
export type VariantGroupOutput = z.output<typeof VariantGroupSchema>;

export const NEW_VARIANT_GROUP_DEFAULT_VALUES: VariantGroupInput = {
  uniqueId: createId(),
  type: VariantGroupType.SIZE,
  sortOrder: 0,
  translations: [{ locale: 'TR', name: '', slug: '' }],
  options: [],
};
