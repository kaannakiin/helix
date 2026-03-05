import { FileType, Locale } from '@org/prisma/browser';
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
  storesSchema,
} from '../../common/common-schemas.js';
import { V } from '../../common/validation-keys.js';

export const CategoryTranslationSchema = z.object({
  locale: z.enum(Locale, { error: V.LOCALE_REQUIRED }),
  name: z
    .string({ error: V.NAME_REQUIRED })
    .trim()
    .min(1, { error: V.NAME_REQUIRED }),
  description: z.string().optional(),
  metaTitle: metaTitleSchema.nullish(),
  metaDescription: metaDescriptionSchema.nullish(),
});

export const BaseCategorySchema = z.object({
  uniqueId: z.cuid2(),
  slug: slugSchema,
  parentId: cuidSchema.optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  activeStores: storesSchema.default([]),
  translations: z
    .array(CategoryTranslationSchema)
    .min(1, { error: V.TRANSLATIONS_MIN }),
  existingImages: z.array(existingImageSchema).default([]),
});

const checkCategory = ({
  issues,
  value,
}: {
  issues: z.core.$ZodRawIssue[];
  value: z.output<typeof BaseCategorySchema>;
}) => {
  const localeDupes = findDuplicates(value.translations, (t) => t.locale);
  for (const dupe of localeDupes) {
    issues.push({
      code: 'custom',
      input: value.translations[dupe.index].locale,
      error: V.DUPLICATE_LOCALE,
      path: ['translations', dupe.index, 'locale'],
    });
  }
};

export const CategorySchema = BaseCategorySchema.safeExtend({
  images: dropzoneFileSchema({
    maxFiles: 5,
    allowedTypes: [FileType.IMAGE],
    required: false,
  }),
}).check((ctx) => {
  checkCategory(ctx);

  const imageCount =
    (ctx.value.images?.length ?? 0) + (ctx.value.existingImages?.length ?? 0);

  if (imageCount > 5) {
    ctx.issues.push({
      code: 'custom',
      input: imageCount,
      error: V.FILES_TOO_MANY,
      path: ['images'],
    });
  }
});

export const BackendCategorySchema = BaseCategorySchema.check(checkCategory);

export type CategoryTranslationInput = z.input<
  typeof CategoryTranslationSchema
>;
export type CategoryTranslationOutput = z.output<
  typeof CategoryTranslationSchema
>;

export type CategoryInput = z.input<typeof CategorySchema>;
export type CategoryOutput = z.output<typeof CategorySchema>;

export const NEW_CATEGORY_DEFAULT_VALUES: CategoryInput = {
  uniqueId: createId(),
  slug: '',
  parentId: '',
  isActive: true,
  activeStores: [],
  translations: [
    {
      locale: 'TR',
      name: '',
      description: '',
      metaTitle: null,
      metaDescription: null,
    },
  ],
  images: [],
  existingImages: [],
};
