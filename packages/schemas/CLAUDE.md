# CLAUDE.md — Schemas Package (@org/schemas)

## Overview

Shared Zod v4 validation schemas used by both frontend (React Hook Form) and backend (NestJS DTOs via nestjs-zod). The critical pattern here is the **Base/Frontend/Backend split** that handles file uploads and `.check()` refinements safely.

## Directory Layout

```
src/
├── common/
│   ├── common-schemas.ts      # Reusable building blocks
│   ├── validation-keys.ts     # V constants (immutable i18n keys)
│   ├── phone-helper.ts        # libphonenumber utilities
│   └── index.ts
├── auth/                      # Login, register, change-password, update-profile
├── admin/
│   ├── brands/                # brand-zod-schema.ts + brand-query-schema.ts
│   ├── categories/            # Reference pattern implementation
│   ├── products/              # Most complex (nested variants, multiple checks)
│   ├── customer-groups/       # Rule-based or manual membership
│   ├── pricing/               # Price lists with nested prices
│   ├── tags/                  # Recursive tree schemas with z.lazy()
│   ├── variants/              # Variant groups with color/size options
│   ├── customers/
│   ├── organizations/
│   ├── warehouses/
│   ├── settings/
│   ├── upload/
│   └── common/                # Lookup schema
├── data-query/                # createDataQuerySchema factory
├── export/                    # createExportQuerySchema factory
└── rule-engine/               # Decision tree + condition set schemas
```

## The Base/Frontend/Backend Pattern

**This is the most important convention in the entire codebase.**

Reference implementation: `src/admin/categories/category-zod-schema.ts`

```
BaseFooSchema                    # z.object({...}) — NO .check(), has existingImages
    │
    ├── checkFoo()               # Shared validation function (duplicates, cross-field)
    │
    ├── FooSchema (Frontend)     # BaseFooSchema.safeExtend({ images }).check(checkFoo)
    │                              Used by React Hook Form
    │
    └── BackendFooSchema         # BaseFooSchema.check(checkFoo)
                                   Used by NestJS DTOs (no images field)
```

### Rules

1. **Never `.omit()` on schemas with `.check()`** — Zod v4 throws: `".omit() cannot be used on object schemas containing refinements"`
2. **Always `.safeExtend()` instead of `.extend()`** — `.extend()` silently drops `.check()` refinements
3. **Frontend schemas** include `images` (dropzoneFileSchema) + `existingImages`
4. **Backend schemas** only have `existingImages` — file uploads go through separate `POST /admin/upload`
5. **Check functions** are shared between frontend and backend schemas

### Template for New Schema

```typescript
import { z } from 'zod';
import { FileType, Locale } from '@org/prisma/browser';
import { createId } from '@paralleldrive/cuid2';
import {
  cuidSchema, dropzoneFileSchema, existingImageSchema,
  findDuplicates, slugSchema, storesSchema,
} from '../../common/common-schemas.js';
import { V } from '../../common/validation-keys.js';

// 1. Translation schema
export const FooTranslationSchema = z.object({
  locale: z.enum(Locale, { error: V.LOCALE_REQUIRED }),
  name: z.string({ error: V.NAME_REQUIRED }).trim().min(1, { error: V.NAME_REQUIRED }),
});

// 2. Base schema — all common fields, NO .check()
export const BaseFooSchema = z.object({
  uniqueId: z.cuid2(),
  slug: slugSchema,
  isActive: z.boolean().default(true),
  activeStores: storesSchema.default([]),
  translations: z.array(FooTranslationSchema).min(1, { error: V.TRANSLATIONS_MIN }),
  existingImages: z.array(existingImageSchema).default([]),
});

// 3. Shared check function
const checkFoo = ({ issues, value }: {
  issues: z.core.$ZodRawIssue[];
  value: z.output<typeof BaseFooSchema>;
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

// 4. Frontend schema — adds images + check
export const FooSchema = BaseFooSchema.safeExtend({
  images: dropzoneFileSchema({ maxFiles: 5, allowedTypes: [FileType.IMAGE], required: false }),
}).check((ctx) => {
  checkFoo(ctx);
  const imageCount = (ctx.value.images?.length ?? 0) + (ctx.value.existingImages?.length ?? 0);
  if (imageCount > 5) {
    ctx.issues.push({ code: 'custom', input: imageCount, error: V.FILES_TOO_MANY, path: ['images'] });
  }
});

// 5. Backend schema — check only, no images
export const BackendFooSchema = BaseFooSchema.check(checkFoo);

// 6. Types
export type FooInput = z.input<typeof FooSchema>;
export type FooOutput = z.output<typeof FooSchema>;

// 7. Default values (for frontend forms)
export const NEW_FOO_DEFAULT_VALUES: FooInput = {
  uniqueId: createId(),
  slug: '',
  isActive: true,
  activeStores: [],
  translations: [{ locale: 'TR', name: '' }],
  images: [],
  existingImages: [],
};
```

## Common Building Blocks (common-schemas.ts)

| Schema | Type | Usage |
|--------|------|-------|
| `cuidSchema` | `z.cuid2()` | ID fields |
| `slugSchema` | string, regex `^[a-z0-9]+(-[a-z0-9]+)*$` | URL slugs |
| `metaTitleSchema` | string, min 1 | SEO meta title |
| `metaDescriptionSchema` | string, min 1 | SEO meta description |
| `sortOrderSchema` | int, nonneg, default 0 | Ordering |
| `passwordSchema` | string, 6-128 chars | Auth passwords |
| `storesSchema` | array of cuid2/string | Multi-store assignment |
| `urlSchema` | `z.url().nullish().or(z.literal(''))` | Optional URLs |
| `hexColorSchema` | regex `^#[0-9a-fA-F]{6}$`, nullish | Color picker values |
| `existingImageSchema` | object { id, url, fileType, sortOrder } | Already-uploaded images |
| `dropzoneFileSchema(opts)` | factory → array of DropzoneFile | Frontend file upload field |
| `findDuplicates(items, keyFn)` | utility function | Detect dupes in check functions |

## Validation Keys (V Constants)

File: `src/common/validation-keys.ts`

Keys are **immutable** i18n paths: `V.EMAIL_INVALID = 'validation.errors.auth.email_invalid'`

Categories: Auth, Common, Duplicates, Files, Variants, Products, Pricing, Customer Groups, Decision Tree, Condition Set, Store.

Usage: `z.string({ error: V.REQUIRED })` or in check functions: `issues.push({ error: V.DUPLICATE_LOCALE, ... })`

**Never change V constant values** — they map to translation keys in `packages/i18n/src/locales/{locale}/validation.json`.

## Data Query Schema Factory

`createDataQuerySchema(config)` generates pagination + filter + sort schemas:

```typescript
import { createDataQuerySchema } from '@org/schemas/data-query';

export const BrandQuerySchema = createDataQuerySchema({
  fields: ADMIN_BRANDS_FIELD_CONFIG,    // from @org/types
  sortFields: ADMIN_BRANDS_SORT_FIELDS, // from @org/types
});
```

Filter types: `text`, `number`, `date`, `boolean`, `enum`.

## Export Query Schema Factory

`createExportQuerySchema(config)` extends data query (no page/limit) with `format`, `columns`, `headers`, `filename`.

## Gotchas

- **Multiple `.check()` calls are ordered** — later checks can assume earlier ones passed:
  `schema.check(checkLocales).check(checkImages).check(checkVariants).check(checkDuplicates)`

- **Recursive schemas** must use `z.lazy()` with explicit type annotation:
  `const RecursiveSchema: z.ZodType<RecursiveInput> = z.lazy(() => BaseSchema.safeExtend({ children: z.array(RecursiveSchema).default([]) }))`

- **Nullable vs optional vs empty string** patterns:
  - `z.string().optional()` — field can be absent
  - `cuidSchema.nullable().default(null)` — field present but null
  - `z.url().nullish().or(z.literal(''))` — null, undefined, or empty string all valid

- **Check function error field** — both `error` and `message` work in `issues.push()`. Codebase uses both inconsistently; prefer `error` for V keys.

## Package Exports

```typescript
import { CategorySchema } from '@org/schemas/admin/categories';
import { V } from '@org/schemas/common';
import { LoginSchema } from '@org/schemas/auth';
import { createDataQuerySchema } from '@org/schemas/data-query';
```

Uses `@org/source` custom condition for source-level imports during development.
