# Schemas Package (`packages/schemas`)

Zod v4 validation schemas shared between backend (NestJS) and frontend (Next.js).

## Zod Version

**Zod 4** (`zod@^4.0.0`). Always use `import { z } from 'zod'` — never import `zod/v3`.

## Error Message Strategy: V Keys

All validation error messages use **V key constants** from `common/validation-keys.ts`. These are i18n lookup paths, not human-readable text.

```ts
import { V } from '../../common/validation-keys.js';

// GOOD — V key as error message
z.string({ error: V.NAME_REQUIRED })            // → 'validation.errors.common.name_required'
z.email({ message: V.EMAIL_INVALID })            // → 'validation.errors.auth.email_invalid'
.min(1, { message: V.TRANSLATIONS_MIN })         // → 'validation.errors.common.translations_min'
.refine(fn, { message: V.PHONE_INVALID })        // → 'validation.errors.auth.phone_invalid'

// BAD — hardcoded string
z.string({ error: 'Name is required' })
z.string().min(1, { message: 'At least 1 character' })

// BAD — factory pattern (REMOVED, do not recreate)
const MyTranslationSchema = (t: TranslationFn) => z.object({
  name: z.string({ error: t('name_required') }),
});
```

### How V keys get translated

| Layer | Mechanism |
|-------|-----------|
| **Backend** | `ZodValidationI18nFilter` catches Zod errors, translates V keys via `nestjs-i18n` before sending HTTP response |
| **Frontend (forms)** | `useFormErrorTranslator()` hook translates V keys via `next-intl` at render time: `error={te(fieldState.error?.message)}` |

### Adding a new V key

1. Add constant to `common/validation-keys.ts`: `MY_ERROR: 'validation.errors.<domain>.<key>'`
2. Add translations to `packages/i18n/src/locales/{en,tr}/validation.json` under matching path
3. Use in schema: `{ message: V.MY_ERROR }` or `{ error: V.MY_ERROR }`

## Schema Design Patterns

### Single Schema (no Create/Update split)

Every schema includes `id: z.cuid2()`. The frontend generates IDs with `@paralleldrive/cuid2` — there is no separate Create vs Update schema.

```ts
// GOOD — single schema with id
export const BrandSchema = z.object({
  id: z.cuid2(),
  slug: slugSchema,
  isActive: z.boolean().default(true),
  sortOrder: sortOrderSchema,
  translations: z.array(translationObject).min(1, { message: V.TRANSLATIONS_MIN }),
  images: dropzoneFileSchema({ ... }),
}).check(checkDuplicateLocales);

export type BrandInput = z.input<typeof BrandSchema>;
export type BrandOutput = z.output<typeof BrandSchema>;

// BAD — separate Create/Update schemas (REMOVED, do not recreate)
export const CreateBrandSchema = z.object({ ... });
export const UpdateBrandSchema = CreateBrandSchema.safeExtend({ id: z.cuid2() });
```

### Base Schema + Composition (for child entities)

When a child entity is used both standalone AND embedded in a parent, extract a **Base schema** (with `id`, without foreign keys) and derive the full schema via `.safeExtend()`:

```ts
// Base — embed for parent (has id, no FK)
export const BaseTagSchema = z.object({
  id: z.cuid2(),
  slug: slugSchema,
  isActive: z.boolean().default(true),
  sortOrder: sortOrderSchema,
  translations: z.array(translationObject).min(1, { message: V.TRANSLATIONS_MIN }),
  images: dropzoneFileSchema({ ... }),
});

// Full — standalone use (FK added via .safeExtend())
export const TagSchema = BaseTagSchema.safeExtend({
  tagGroupId: cuidSchema,
}).check(checkDuplicateLocales);

// Parent schema — embeds Base directly
export const TagGroupSchema = z.object({
  id: z.cuid2(),
  ...fields,
  tags: z.array(BaseTagSchema).default([]),
}).check(complexValidation);
```

**Rules:**
- `Base` = shared fields including `id`, no foreign keys
- Full schema = `Base.safeExtend({ foreignKey })` + `.check()` validations
- Parent schemas embed `Base`, never duplicate the shape inline

### File Upload Pattern (Image Fields)

`images: dropzoneFileSchema(...)` browser'a özgüdür — backend DTO'larında kullanılamaz (NestJS deserialize edemez).
`.omit()` `.check()` olan şemalarda Zod v4 runtime error verir. Bunun yerine:

1. Check logic'i ayrı fonksiyon olarak extract et
2. Base schema tanımla (`images` yok, `.check()` yok)
3. Frontend schema: `Base.safeExtend({ images }).check(checkFn)`
4. Backend schema: `Base.check(checkFn)` (veya ayrı shape ile)

```ts
// GOOD — paylaşılan check fn, ayrı base
const checkBrand = ({ issues, value }) => { /* duplicate locale, vb. */ };

export const BaseBrandSchema = z.object({ id, slug, existingImages, ... });

export const BrandSchema = BaseBrandSchema
  .safeExtend({ images: dropzoneFileSchema(...) })
  .check(ctx => { checkBrand(ctx); /* + toplam image count check */ });

export const BackendBrandSchema = BaseBrandSchema.check(checkBrand);

// Backend DTO
export class BrandSaveDTO extends (createZodDto(BackendBrandSchema) as ZodDto<...>) {}

// BAD — .omit() .check() olan şemada çalışmaz (Zod v4 runtime error)
export const BackendBrandSchema = BrandSchema.omit({ images: true }); // ❌

// BAD — .extend() .check() refinements'ı düşürür
export const BrandSchemaWithExtra = BrandSchema.extend({ ... }); // ❌
```

Upload `POST /admin/upload` endpoint'inde ayrı yapılır. Entity save sadece `existingImages` (id + sortOrder) alır.

### `.safeExtend()` only — `.extend()` is forbidden

**ALWAYS** use `.safeExtend()`. Never use `.extend()` — it drops `.check()` refinements:

```ts
// GOOD — .safeExtend() preserves .check()
export const TagSchema = BaseTagSchema.safeExtend({
  tagGroupId: cuidSchema,
}).check(checkDuplicateLocales);

// BAD — .extend() drops .check() refinements
export const TagSchema = BaseTagSchema.extend({
  tagGroupId: cuidSchema,
}).check(checkDuplicateLocales);
```

### Discriminated Union (Login pattern)

For schemas where the shape changes based on a discriminator field:

```ts
export const LoginSchema = z.discriminatedUnion('type', [
  EmailLoginSchema.safeExtend({ type: z.literal('email') }),
  PhoneLoginSchema.safeExtend({ type: z.literal('phone') }),
]);
```

### `.check()` for Cross-field Validation

Use `.check()` (Zod v4) instead of `.refine()`/`.superRefine()` for cross-field validations that push multiple issues:

```ts
.check(({ issues, value }) => {
  const dupes = findDuplicates(value.translations, (t) => t.locale);
  for (const dupe of dupes) {
    issues.push({
      code: 'custom',
      input: value.translations[dupe.index].locale,
      message: V.DUPLICATE_LOCALE,
      path: ['translations', dupe.index, 'locale'],
    });
  }
})
```

Issue type is `z.core.$ZodRawIssue`.

## Common Schemas (`common/common-schemas.ts`)

Reusable building blocks — always import from here instead of redefining:

| Schema | Usage |
|--------|-------|
| `passwordSchema` | Password field (6-128 chars) |
| `slugSchema` | URL slug (lowercase, hyphenated) |
| `cuidSchema` | CUID2 ID validation |
| `sortOrderSchema` | Non-negative integer, default 0 |
| `hexColorSchema` | Optional `#RRGGBB` |
| `urlSchema` | Optional URL or empty string |
| `dropzoneFileSchema()` | File upload array with type/size constraints |
| `richTextSchema()` | HTML content with DOMPurify sanitization |
| `findDuplicates()` | Helper for duplicate detection in `.check()` |

## Shared Admin Schemas (`admin/common`)

Reusable schemas for admin module patterns:

```ts
import { LookupQuerySchema, type LookupItem } from '@org/schemas/admin/common';
```

| Schema | Usage |
|--------|-------|
| `LookupQuerySchema` | Lookup endpoint query validation (`q?`, `ids?`, `limit`) |

### LookupItem Interface

Standard response shape for all lookup endpoints:

```ts
interface LookupItem {
  id: string;
  label: string;
  slug?: string;
  imageUrl?: string;
  group?: string;           // e.g. TagGroup name for grouped dropdowns
  extra?: Record<string, unknown>;  // entity-specific data (websiteUrl, depth, etc.)
}
```

## Type Exports

Every schema file exports `Input` and `Output` types:

```ts
export type BrandInput = z.input<typeof BrandSchema>;
export type BrandOutput = z.output<typeof BrandSchema>;
```

- **`Input`** = what the form sends (pre-transform, pre-default)
- **`Output`** = what the backend receives (post-transform, post-default)
- Frontend `useForm<InputType>`, backend handler receives `OutputType`
- Naming: `XInput`, `XOutput` (no Create/Update prefix)

## Package Exports

Subpath exports via `package.json`:

```ts
import { LoginSchema } from '@org/schemas/auth';
import { ProductSchema } from '@org/schemas/admin/products';
import { V, slugSchema } from '@org/schemas/common';
import { LookupQuerySchema, type LookupItem } from '@org/schemas/admin/common';
```

## Rules

- **DO NOT** create separate Create/Update schemas — use a single schema with `id: z.cuid2()`
- **DO NOT** use `.extend()` — always use `.safeExtend()`
- **DO NOT** create factory translation schemas like `SomeTranslationSchema(t)` — use V keys
- **DO NOT** duplicate schema shapes inline — extract a Base schema and import it
- **DO NOT** use `z.refine()` where `.check()` is more appropriate (multiple issues, cross-field)
- **DO NOT** use Zod v3 APIs (`z.ZodError`, `.safeParse()` for error checking) — use Zod v4 equivalents
- **ALWAYS** include `id: z.cuid2()` in every schema (frontend generates IDs)
- **ALWAYS** use V keys for error messages
- **ALWAYS** export both `Input` and `Output` types
- **ALWAYS** use shared schemas from `common/common-schemas.ts` instead of redefining
