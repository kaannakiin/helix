import { Locale } from '@org/prisma/browser';
import { z } from 'zod';
import {
  findDuplicates,
  slugSchema,
  sortOrderSchema,
} from '../../common/common-schemas.js';
import { V } from '../../common/validation-keys.js';
import { BaseTagCoreSchema, BaseTagSchema } from './tag-zod-schema.js';

const tagGroupTranslationSchema = z.object({
  locale: z.enum(Locale, { error: V.LOCALE_REQUIRED }),
  name: z
    .string({ error: V.NAME_REQUIRED })
    .trim()
    .min(1, { message: V.NAME_REQUIRED }),
  description: z.string().optional(),
});

const checkTagGroup = ({
  issues,
  value,
}: {
  issues: z.core.$ZodRawIssue[];
  value: {
    translations: Array<{ locale: string }>;
    tags: Array<{ slug: string; translations: Array<{ locale: string; name: string }> }>;
  };
}) => {
  const groupLocaleDupes = findDuplicates(
    value.translations,
    (t) => t.locale
  );
  for (const dupe of groupLocaleDupes) {
    issues.push({
      code: 'custom',
      input: value.translations[dupe.index].locale,
      message: V.DUPLICATE_LOCALE,
      path: ['translations', dupe.index, 'locale'],
    });
  }

  const slugDupes = findDuplicates(value.tags, (tag) => tag.slug);
  for (const dupe of slugDupes) {
    issues.push({
      code: 'custom',
      input: value.tags[dupe.index].slug,
      message: V.DUPLICATE_SLUG,
      path: ['tags', dupe.index, 'slug'],
    });
  }

  const namesByLocale = new Map<string, Map<string, number>>();
  for (let tagIdx = 0; tagIdx < value.tags.length; tagIdx++) {
    const tag = value.tags[tagIdx];
    for (let transIdx = 0; transIdx < tag.translations.length; transIdx++) {
      const trans = tag.translations[transIdx];
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
          path: ['tags', tagIdx, 'translations', transIdx, 'name'],
        });
      } else {
        localeNames.set(normalizedName, tagIdx);
      }
    }
  }

  for (let tagIdx = 0; tagIdx < value.tags.length; tagIdx++) {
    const tagLocaleDupes = findDuplicates(
      value.tags[tagIdx].translations,
      (t) => t.locale
    );
    for (const dupe of tagLocaleDupes) {
      issues.push({
        code: 'custom',
        input: value.tags[tagIdx].translations[dupe.index].locale,
        message: V.DUPLICATE_LOCALE,
        path: ['tags', tagIdx, 'translations', dupe.index, 'locale'],
      });
    }
  }
};

const tagGroupBaseShape = z.object({
  id: z.cuid2(),
  slug: slugSchema,
  isActive: z.boolean().default(true),
  sortOrder: sortOrderSchema,
  translations: z.array(tagGroupTranslationSchema).min(1, { message: V.TRANSLATIONS_MIN }),
  tags: z.array(BaseTagSchema).default([]),
});

export const TagGroupSchema = tagGroupBaseShape.check(checkTagGroup);

const backendTagGroupShape = z.object({
  id: z.cuid2(),
  slug: slugSchema,
  isActive: z.boolean().default(true),
  sortOrder: sortOrderSchema,
  translations: z.array(tagGroupTranslationSchema).min(1, { message: V.TRANSLATIONS_MIN }),
  tags: z.array(BaseTagCoreSchema).default([]),
});

export const BackendTagGroupSchema = backendTagGroupShape.check(checkTagGroup);

export type TagGroupInput = z.input<typeof TagGroupSchema>;
export type TagGroupOutput = z.output<typeof TagGroupSchema>;
