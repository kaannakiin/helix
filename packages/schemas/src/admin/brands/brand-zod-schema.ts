import { FileType, Locale } from '@org/prisma/browser';
import { z } from 'zod';
import {
  dropzoneFileSchema,
  existingImageSchema,
  findDuplicates,
  slugSchema,
  sortOrderSchema,
  urlSchema,
} from '../../common/common-schemas.js';
import { V } from '../../common/validation-keys.js';

export const BaseBrandSchema = z.object({
  id: z.cuid2(),
  slug: slugSchema,
  websiteUrl: urlSchema,
  isActive: z.boolean().default(true),
  sortOrder: sortOrderSchema,
  translations: z
    .array(
      z.object({
        locale: z.enum(Locale, { error: V.LOCALE_REQUIRED }),
        name: z
          .string({ error: V.NAME_REQUIRED })
          .trim()
          .min(1, { message: V.NAME_REQUIRED }),
        description: z.string().optional(),
      })
    )
    .min(1, { message: V.TRANSLATIONS_MIN }),
  existingImages: z.array(existingImageSchema).default([]),
});

const checkBrand = ({
  issues,
  value,
}: {
  issues: z.core.$ZodRawIssue[];
  value: z.output<typeof BaseBrandSchema>;
}) => {
  const localeDupes = findDuplicates(value.translations, (t) => t.locale);
  for (const dupe of localeDupes) {
    issues.push({
      code: 'custom',
      input: value.translations[dupe.index].locale,
      message: V.DUPLICATE_LOCALE,
      path: ['translations', dupe.index, 'locale'],
    });
  }
};

export const BrandSchema = BaseBrandSchema.safeExtend({
  images: dropzoneFileSchema({
    maxFiles: 3,
    allowedTypes: [FileType.IMAGE],
    required: false,
  }),
}).check((ctx) => {
  checkBrand(ctx);

  const imageCount =
    (ctx.value.images?.length ?? 0) + (ctx.value.existingImages?.length ?? 0);

  if (imageCount > 3) {
    ctx.issues.push({
      code: 'custom',
      input: imageCount,
      message: V.FILES_TOO_MANY,
      path: ['images'],
    });
  }
});

export const BackendBrandSchema = BaseBrandSchema.check(checkBrand);

export type BrandInput = z.input<typeof BrandSchema>;
export type BrandOutput = z.output<typeof BrandSchema>;
