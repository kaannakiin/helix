# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (all apps in parallel)
npm start                          # runs: nx run-many -t serve dev --parallel

# Individual apps
npx nx serve backend               # NestJS API on :3003, Swagger at /docs
npx nx dev portal                   # Next.js admin on :3000
npx nx dev b2c-storefront           # Next.js B2C on :3200
npx nx dev b2b-storefront           # Next.js B2B on :3300
npx nx serve storefront-router      # Fastify router on :3100

# Build, lint, test, typecheck
npx nx run-many -t build --parallel
npx nx run-many -t lint test typecheck --parallel
npx nx test <project>               # single project tests (Jest)
npx nx e2e backend-e2e              # Playwright E2E

# Prisma
npx nx prisma-generate prisma       # generate client
npx nx prisma-migrate prisma        # run migrations
npx nx seed prisma                  # seed dev data

# Docker (production)
docker compose up -d                          # core services
docker compose --profile full up -d           # all storefronts
docker compose run --rm seed                  # run seeds
```

## Architecture

Nx monorepo with 5 apps and 8 shared packages. All TypeScript (strict, ES2022, nodenext).

**Apps:**

| App | Framework | Port | Purpose |
|-----|-----------|------|---------|
| `backend` | NestJS 11 | 3003 | REST API (`/api` prefix), Swagger at `/docs` |
| `portal` | Next.js 16 | 3000 | Admin dashboard (Mantine + ag-grid) |
| `b2c-storefront` | Next.js 16 | 3200 | Consumer storefront |
| `b2b-storefront` | Next.js 16 | 3300 | Business buyer storefront |
| `storefront-router` | Fastify 5 | 3100 | Host-based routing, resolves domains to stores |

**Packages:** `prisma` (Prisma 7.4 + PostgreSQL), `schemas` (Zod 4), `i18n` (en/tr), `types`, `constants`, `ui` (Mantine), `hooks`, `utils`

**Traffic flow:** Caddy (TLS) -> portal OR storefront-router -> b2c/b2b-storefront. Router resolves hostname via `/.well-known/helix-routing` and injects `x-store-id`, `x-store-slug`, `x-business-model` headers.

**Backend module pattern:** Each domain is a self-contained NestJS module at `apps/backend/src/app/admin/{domain}/` with `{domain}.module.ts`, `{domain}.controller.ts`, `{domain}.service.ts`, and `dto/` directory.

**API client pair:** Client-side uses `apiClient` (from `@org/utils/http/create-api-client`), server components use `serverFetch` (from `apps/portal/core/lib/api/server-fetch.ts`) with cookie forwarding.

## Zod Schema Pattern (Critical)

**Reference:** `packages/schemas/src/admin/categories/category-zod-schema.ts`

Every admin schema follows this pattern:

```
BaseFooSchema          # plain z.object(), NO .check()
  ↓
checkFoo()             # validation function (duplicate checks, cross-field rules)
  ↓
FooSchema              # BaseFooSchema.safeExtend({ images: dropzoneFileSchema(...) }).check(checkFoo)
  ↓                      Used by frontend forms
BackendFooSchema       # BaseFooSchema.check(checkFoo)
                         Used by NestJS DTOs (no images field)
```

**Rules:**
- Never use `.omit()` on schemas with `.check()` — causes runtime error in Zod v4
- Always use `.safeExtend()` instead of `.extend()` — `.extend()` drops `.check()` refinements
- Frontend schemas include `images` + `existingImages`; backend schemas only have `existingImages`
- File uploads go through separate `POST /admin/upload` endpoint
- Common building blocks are in `packages/schemas/src/common/common-schemas.ts`

## Validation Keys & i18n

**Validation keys:** `V` constants in `packages/schemas/src/common/validation-keys.ts` map to i18n paths (e.g., `V.EMAIL_INVALID = 'validation.errors.auth.email_invalid'`). These are immutable identifiers — never change the values.

**Three namespaces per locale** (in `packages/i18n/src/locales/{locale}/`):
- `validation.json` — Zod error messages (referenced by V keys)
- `backend.json` — NestJS error messages (e.g., `throw new NotFoundException('backend.errors.product_not_found')`)
- `frontend.json` — UI strings per app, accessed via `useTranslations('frontend.admin.products')`

**Forms must use** `useTranslatedZodResolver` from `@org/hooks` — never raw `zodResolver`.

**Backend errors** are translated by `HttpExceptionI18nFilter` and `ZodValidationI18nFilter` based on `Accept-Language` header.

## Key Conventions

- **Package exports** use `@org/source` custom condition for source-level imports during development
- **State management (portal):** Zustand + immer for auth store, TanStack Query for server state, React Hook Form for forms
- **Data tables:** ag-grid infinite row model with `IDatasource` + `useColumnFactory` + `serializeGridQuery`. Backend uses `buildPrismaQuery()` to convert filter/sort params to Prisma queries
- **Authentication:** JWT httpOnly cookies. Global `JwtAuthGuard` with `@Public()` decorator for open routes. Storefront has separate `StorefrontAuthModule`
- **Content locale:** `ContentLocaleInterceptor` + `@ContentLocale()` decorator for multi-language data queries (separate from UI locale)
- **File storage:** MinIO with `UploadService`. Images have polymorphic ownership (product, productVariant, productVariantGroupOption)
- **Error pattern:** Backend throws NestJS exceptions with i18n message keys: `throw new NotFoundException('backend.errors.product_not_found')`
