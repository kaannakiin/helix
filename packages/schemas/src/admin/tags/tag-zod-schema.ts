import { FileType, Locale } from '@org/prisma/browser';
import { z } from 'zod';
import {
  cuidSchema,
  dropzoneFileSchema,
  existingImageSchema,
  findDuplicates,
  slugSchema,
  sortOrderSchema,
} from '../../common/common-schemas.js';
import { V } from '../../common/validation-keys.js';

const checkDuplicateLocales = ({
  issues,
  value,
}: {
  issues: z.core.$ZodRawIssue[];
  value: { translations: Array<{ locale: string }> };
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

// Base without images — used for backend DTOs and parent schema embedding
export const BaseTagCoreSchema = z.object({
  id: z.cuid2(),
  slug: slugSchema,
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

// Full base with images — used for embedding in TagGroupSchema (frontend)
export const BaseTagSchema = BaseTagCoreSchema.safeExtend({
  images: dropzoneFileSchema({
    maxFiles: 3,
    allowedTypes: [FileType.IMAGE],
    required: false,
  }),
});

// Backend base — no images field
export const BackendBaseTagSchema = BaseTagCoreSchema.check(checkDuplicateLocales);

export const TagSchema = BaseTagSchema.safeExtend({
  tagGroupId: cuidSchema,
}).check(checkDuplicateLocales);

export type BaseTagInput = z.input<typeof BaseTagSchema>;
export type BaseTagOutput = z.output<typeof BaseTagSchema>;
export type TagInput = z.input<typeof TagSchema>;
export type TagOutput = z.output<typeof TagSchema>;
