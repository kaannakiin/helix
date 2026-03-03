import { Locale } from '@org/prisma/browser';
import { createId } from '@paralleldrive/cuid2';
import { z } from 'zod';
import {
  findDuplicates,
  slugSchema,
  sortOrderSchema,
} from '../../common/common-schemas.js';
import { V } from '../../common/validation-keys.js';
import {
  RecursiveBackendTagSchema,
  RecursiveTagSchema,
} from './tag-zod-schema.js';

const tagGroupTranslationSchema = z.object({
  locale: z.enum(Locale, { error: V.LOCALE_REQUIRED }),
  name: z
    .string({ error: V.NAME_REQUIRED })
    .trim()
    .min(1, { message: V.NAME_REQUIRED }),
  description: z.string().optional(),
});

type TagNodeForValidation = {
  slug: string;
  translations: Array<{ locale: string; name: string }>;
  children?: TagNodeForValidation[];
};

function flatTagsForValidation(
  tags: TagNodeForValidation[]
): TagNodeForValidation[] {
  const result: TagNodeForValidation[] = [];
  const stack = [...tags];
  while (stack.length > 0) {
    const tag = stack.pop()!;
    result.push(tag);
    if (Array.isArray(tag.children) && tag.children.length > 0) {
      stack.push(...tag.children);
    }
  }
  return result;
}

const checkTagGroup = ({
  issues,
  value,
}: z.core.ParsePayload<{
  translations: Array<{ locale: string }>;
  tags: TagNodeForValidation[];
}>) => {
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

  const flatTags = flatTagsForValidation(value.tags);

  const slugDupes = findDuplicates(flatTags, (tag) => tag.slug);
  for (const dupe of slugDupes) {
    issues.push({
      code: 'custom',
      input: flatTags[dupe.index].slug,
      message: V.DUPLICATE_SLUG,
      path: ['tags', dupe.index, 'slug'],
    });
  }

  const namesByLocale = new Map<string, Map<string, number>>();
  for (let tagIdx = 0; tagIdx < flatTags.length; tagIdx++) {
    const tag = flatTags[tagIdx];
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

  for (let tagIdx = 0; tagIdx < flatTags.length; tagIdx++) {
    const tagLocaleDupes = findDuplicates(
      flatTags[tagIdx].translations,
      (t) => t.locale
    );
    for (const dupe of tagLocaleDupes) {
      issues.push({
        code: 'custom',
        input: flatTags[tagIdx].translations[dupe.index].locale,
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
  tags: z.array(RecursiveTagSchema).default([]),
});

export const TagGroupSchema = tagGroupBaseShape.check(checkTagGroup);

const backendTagGroupShape = z.object({
  id: z.cuid2(),
  slug: slugSchema,
  isActive: z.boolean().default(true),
  sortOrder: sortOrderSchema,
  translations: z.array(tagGroupTranslationSchema).min(1, { message: V.TRANSLATIONS_MIN }),
  tags: z.array(RecursiveBackendTagSchema).default([]),
});

export const BackendTagGroupSchema = backendTagGroupShape.check(checkTagGroup);

export type TagGroupInput = z.input<typeof TagGroupSchema>;
export type TagGroupOutput = z.output<typeof TagGroupSchema>;

export const NEW_TAG_GROUP_DEFAULT_VALUES: TagGroupInput = {
  id: createId(),
  slug: '',
  isActive: true,
  sortOrder: 0,
  translations: [{ locale: 'TR', name: '', description: '' }],
  tags: [],
};
