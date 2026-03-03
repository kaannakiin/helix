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
}: z.core.ParsePayload<{ translations: Array<{ locale: string }> }>) => {
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

export const BaseTagCoreSchema = z.object({
  id: z.cuid2(),
  slug: slugSchema,
  parentTagId: cuidSchema.nullable().default(null),
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

export const BaseTagSchema = BaseTagCoreSchema.safeExtend({
  images: dropzoneFileSchema({
    maxFiles: 3,
    allowedTypes: [FileType.IMAGE],
    required: false,
  }),
});

export const BackendBaseTagSchema = BaseTagCoreSchema.check(
  checkDuplicateLocales
);

export const TagSchema = BaseTagSchema.safeExtend({
  tagGroupId: cuidSchema,
}).check(checkDuplicateLocales);

export type BaseTagInput = z.input<typeof BaseTagSchema>;
export type BaseTagOutput = z.output<typeof BaseTagSchema>;
export type TagInput = z.input<typeof TagSchema>;
export type TagOutput = z.output<typeof TagSchema>;

type TagTranslation = Array<{
  locale: string;
  name: string;
  description?: string;
}>;
type ExistingImageEntry = Array<{
  id: string;
  url: string;
  fileType: string;
  sortOrder: number;
}>;

export type RecursiveTagInput = {
  id: string;
  slug: string;
  parentTagId: string | null;
  isActive: boolean;
  sortOrder: number;
  translations: TagTranslation;
  existingImages: ExistingImageEntry;
  images: Array<{ id: string; file: File; fileType: string; order: number }>;
  children: RecursiveTagInput[];
};

export type RecursiveBackendTagInput = {
  id: string;
  slug: string;
  parentTagId: string | null;
  isActive: boolean;
  sortOrder: number;
  translations: TagTranslation;
  existingImages: ExistingImageEntry;
  children: RecursiveBackendTagInput[];
};

export const RecursiveTagSchema: z.ZodType<RecursiveTagInput> = z.lazy(() =>
  BaseTagSchema.safeExtend({
    children: z.array(RecursiveTagSchema).default([]),
  })
);

export const RecursiveBackendTagSchema: z.ZodType<RecursiveBackendTagInput> =
  z.lazy(() =>
    BaseTagCoreSchema.safeExtend({
      children: z.array(RecursiveBackendTagSchema).default([]),
    })
  );
