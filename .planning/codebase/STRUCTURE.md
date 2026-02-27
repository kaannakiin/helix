# Codebase Structure

**Analysis Date:** 2026-02-27

## Directory Layout

```
helix/
├── apps/
│   ├── backend/                    # NestJS API server (port 3001, Webpack-bundled)
│   │   ├── src/
│   │   │   ├── main.ts             # Bootstrap with global middleware/filters/pipes
│   │   │   ├── app/
│   │   │   │   ├── app.module.ts   # Root module, imports all sub-modules
│   │   │   │   ├── auth/           # Auth controllers/services (login, register, refresh, sessions)
│   │   │   │   ├── admin/          # Admin CRUD modules (brands, products, categories, etc.)
│   │   │   │   ├── geolocation/    # Geolocation service
│   │   │   │   ├── export/         # Excel/CSV export service
│   │   │   │   ├── i18n/           # i18n module + exception filters (HttpExceptionI18nFilter, ZodValidationI18nFilter)
│   │   │   │   └── prisma/         # Prisma service (database client)
│   │   │   └── core/
│   │   │       ├── decorators/     # @Public, @CurrentUser, @Roles, @Locale
│   │   │       ├── pipes/          # Custom pipes
│   │   │       └── utils/          # prisma-query-builder, ua-parser, cookie utils
│   │   ├── dist/                   # Built output (Webpack)
│   │   └── tsconfig.json
│   │
│   ├── web/                        # Next.js 16 frontend (port 3000, App Router)
│   │   ├── app/
│   │   │   ├── layout.tsx          # Root layout (providers, auth hydration, i18n setup)
│   │   │   ├── global.css          # Tailwind + Mantine CSS layers
│   │   │   ├── (auth)/             # Auth route group (login, register)
│   │   │   │   ├── auth/
│   │   │   │   │   ├── page.tsx    # Auth page with login/register tabs
│   │   │   │   │   └── components/ # Login, register, OAuth forms
│   │   │   │   └── layout.tsx
│   │   │   ├── (admin)/            # Admin route group (protected, role-based)
│   │   │   │   ├── admin/
│   │   │   │   │   ├── page.tsx    # Dashboard
│   │   │   │   │   ├── products/   # Products list, create/edit
│   │   │   │   │   ├── brands/     # Brands CRUD
│   │   │   │   │   ├── categories/ # Categories CRUD
│   │   │   │   │   ├── tags/       # Tags (tag groups) CRUD
│   │   │   │   │   ├── variants/   # Variants CRUD
│   │   │   │   │   ├── customers/  # Customers DataTable
│   │   │   │   │   └── definitions/# Geolocation, UOM, etc.
│   │   │   │   └── layout.tsx
│   │   │   └── (user)/             # User route group (profile, settings)
│   │   │
│   │   ├── core/
│   │   │   ├── ui/
│   │   │   │   └── components/     # Reusable components (DataTable, layouts, modals)
│   │   │   ├── hooks/              # React Query + Zustand hooks (mutations, queries)
│   │   │   ├── stores/             # Zustand stores (auth.store.ts)
│   │   │   ├── providers/          # Auth, Query, Locale, Theme providers
│   │   │   ├── lib/
│   │   │   │   ├── api/            # apiClient (Axios), ApiError, serverFetch
│   │   │   │   ├── theme.ts        # Mantine theme config
│   │   │   │   └── ...
│   │   │   ├── config/             # App config
│   │   │   └── i18n/
│   │   │       └── request.ts      # next-intl request handler
│   │   │
│   │   ├── public/                 # Static assets (icons, images)
│   │   ├── dist/                   # Built output
│   │   └── tsconfig.json
│   │
│   └── backend-e2e/                # Jest-based E2E tests for backend
│       └── src/
│           └── ...
│
├── packages/
│   ├── prisma/                     # Prisma client + schema
│   │   ├── prisma/
│   │   │   ├── schema/             # Multi-file schema (base, enums, user, session, token, audit, etc.)
│   │   │   │   ├── base.prisma
│   │   │   │   ├── user.prisma
│   │   │   │   ├── session.prisma
│   │   │   │   ├── token.prisma
│   │   │   │   ├── brand.prisma
│   │   │   │   ├── category.prisma
│   │   │   │   ├── product.prisma
│   │   │   │   ├── tag.prisma
│   │   │   │   ├── variant.prisma
│   │   │   │   ├── pricing.prisma
│   │   │   │   ├── enums.prisma
│   │   │   │   └── ... (more domain models)
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   ├── generated/          # Generated Prisma client
│   │   │   ├── seeds/              # Seed scripts
│   │   │   └── index.ts            # Exports Prisma client
│   │   └── tsconfig.json
│   │
│   ├── schemas/                    # Zod validation schemas (shared)
│   │   └── src/
│   │       ├── auth/               # Login, register, change password schemas
│   │       ├── common/             # Shared schemas (phone, phone input, common validation keys)
│   │       ├── admin/              # Admin CRUD schemas
│   │       │   ├── brands/         # Brand query, save, export schemas
│   │       │   ├── products/       # Product schemas
│   │       │   ├── categories/     # Category schemas
│   │       │   ├── tags/           # Tag group schemas
│   │       │   ├── variants/       # Variant schemas
│   │       │   ├── customers/      # Customer schemas
│   │       │   └── ... (more domains)
│   │       └── data-query/         # createDataQuerySchema() utility
│   │
│   ├── types/                      # Shared TypeScript types
│   │   └── src/
│   │       ├── token/              # TokenPayload type
│   │       ├── pagination/         # Pagination, PaginatedResponse types
│   │       ├── data-query/         # FieldFilterConfig, SortCondition types
│   │       ├── export/             # ExportColumnDef type
│   │       └── admin/              # Admin entity types
│   │           ├── brands/         # AdminBrandListPrismaQuery, AdminBrandListPrismaType, BRAND_FIELD_CONFIG
│   │           ├── products/       # Product types
│   │           ├── categories/     # Category types
│   │           ├── tags/           # Tag types
│   │           ├── variants/       # Variant types
│   │           ├── customers/      # Customer types
│   │           └── ... (more domains)
│   │
│   ├── constants/                  # Shared constants
│   │   └── src/
│   │       ├── auth-constants.ts   # Auth-related constants
│   │       ├── data-keys/          # React Query DATA_ACCESS_KEYS
│   │       └── ... (more constants)
│   │
│   ├── i18n/                       # i18n locale files
│   │   └── src/
│   │       └── locales/
│   │           ├── en/
│   │           │   ├── common.json # English UI strings
│   │           │   └── validation.json
│   │           └── tr/
│   │               ├── common.json # Turkish UI strings
│   │               └── validation.json
│   │
│   ├── ui/                         # Shared UI components
│   │   └── src/
│   │       ├── index.ts            # Barrel export
│   │       ├── data-table/         # AG-Grid wrapper component
│   │       │   ├── components/     # DataTable.tsx, column factory
│   │       │   └── types/
│   │       ├── inputs/             # Custom form inputs
│   │       │   ├── phone-input/    # Phone input component
│   │       │   ├── relation-input/ # Relation selector
│   │       │   ├── rich-text-editor/
│   │       │   └── ...
│   │       ├── dropzone/           # File upload zone
│   │       └── ... (more UI components)
│   │
│   └── utils/                      # Shared utility functions
│       └── src/
│           └── ...
│
├── nx.json                         # Nx workspace config
├── tsconfig.base.json              # Base TypeScript config with path aliases
├── tsconfig.json                   # Root TypeScript config
├── package.json                    # Root dependencies
├── jest.config.ts                  # Jest global config
├── eslint.config.mjs               # ESLint config
└── .prettier*                      # Prettier config
```

## Directory Purposes

**`apps/backend/src/app/`** — Application domain logic
- All business logic organized by domain (auth, admin entities, exports)
- Each admin entity follows a consistent 3-file pattern: controller, service, module
- Each admin entity has a `dto/` folder with 3 DTO classes (Query, Lookup, Export)
- Global exception filters and i18n integration

**`apps/backend/src/core/`** — Cross-cutting utilities
- Decorators for auth (@Public, @CurrentUser, @Roles, @Locale)
- Custom pipes and guards
- Utilities for common operations (Prisma query builder, user agent parsing)

**`apps/web/app/(route-group)/`** — Next.js route groups
- Three route groups: (auth), (admin), (user)
- Each contains domain-specific pages and components
- Route groups allow shared layouts without URL inclusion

**`apps/web/core/`** — Frontend infrastructure
- Hooks for React Query (server state)
- Stores for Zustand (client state, auth)
- Providers wrapping the app
- API client (Axios) and utility functions
- i18n configuration

**`packages/prisma/prisma/schema/`** — Database schema (multi-file)
- Each domain model in separate `.prisma` file (user, session, token, brand, product, etc.)
- Composed into single schema by Prisma config
- Migrations stored in `migrations/`

**`packages/schemas/src/admin/`** — Zod validation schemas
- Mirrors admin entity structure from backend
- Each entity folder contains: query schema, save schema, export schema
- Shared with backend DTOs and frontend forms

**`packages/types/src/admin/`** — Admin entity types
- Prisma include queries and inferred types
- Field filter configs and sort field lists
- Used to generate Zod schemas and type frontend DataTable columns

**`packages/i18n/src/locales/`** — Translation files
- Separate files per language (en, tr)
- Namespaces: `common.json` (UI), `validation.json` (form errors)
- Shared between backend (nestjs-i18n) and frontend (next-intl)

## Key File Locations

**Entry Points:**
- Backend bootstrap: `apps/backend/src/main.ts`
- Frontend root layout: `apps/web/app/layout.tsx`
- Frontend middleware: `apps/web/middleware.ts` (not shown in explore, but referenced in CLAUDE.md as `proxy.ts`)

**Configuration:**
- Nx workspace: `nx.json`
- TypeScript aliases: `tsconfig.base.json` (defines `@org/*` scope aliases)
- Prisma config: `packages/prisma/prisma.config.ts` (not shown; infers schema location)
- Next.js: `apps/web/next.config.js` (not shown)
- NestJS: `apps/backend/tsconfig.lib.json` (build config)

**Core Logic:**
- Auth flow: `apps/backend/src/app/auth/auth.controller.ts`, `auth.service.ts`, `session.service.ts`, `device.service.ts`
- Admin module: `apps/backend/src/app/admin/admin.module.ts`
- Brand CRUD (example): `apps/backend/src/app/admin/brands/brands.controller.ts`, `brands.service.ts`, `dto/`, `brands.export-config.ts`
- Prisma service: `apps/backend/src/app/prisma/prisma.service.ts`
- Query builder: `apps/backend/src/core/utils/prisma-query-builder.ts`
- Frontend API client: `apps/web/core/lib/api/api-client.ts`
- Frontend auth store: `apps/web/core/stores/auth.store.ts`
- Frontend auth provider: `apps/web/core/providers/auth-provider.tsx`

**Testing:**
- Backend unit tests: co-located as `*.spec.ts` or `*.test.ts` in `apps/backend/src/`
- Backend E2E tests: `apps/backend-e2e/src/`
- Test config: `jest.config.ts` (root), overridden per project

**Styling:**
- Tailwind CSS: `apps/web/app/global.css` (Tailwind directives + Mantine preset)
- Mantine theme: `apps/web/core/lib/theme.ts`

## Naming Conventions

**Files:**
- Controllers: `{entity}.controller.ts` (e.g., `brands.controller.ts`)
- Services: `{entity}.service.ts` (e.g., `brands.service.ts`)
- DTOs: `{entity-action}.dto.ts` in `dto/` folder (e.g., `brand-query.dto.ts`, `brand-save.dto.ts`)
- Modules: `{entity}.module.ts` (e.g., `brands.module.ts`)
- Schemas: `{entity}-zod-schema.ts` (e.g., `brand-zod-schema.ts`)
- Types: singular with file name matching domain (e.g., `brand-types.ts` or just in `index.ts`)
- Stores: `{feature}.store.ts` (e.g., `auth.store.ts`)
- Hooks: `use{Feature}` (e.g., `useAdminBrands.ts`)
- Components: PascalCase folder with `index.tsx` or separate file (e.g., `BrandForm.tsx`)
- Pages: `page.tsx` in Next.js route directory
- Tests: `{file}.spec.ts` or `{file}.test.ts`

**Directories:**
- Admin entities: `apps/backend/src/app/admin/{entity}/` (plural)
- Route groups: `apps/web/app/({name})/` (kebab-case, parentheses)
- Domain folders in packages: singular (`brands/`, `products/`, `customers/`)
- Subdirectories: `dto/`, `components/`, `hooks/`, `stores/`, `lib/`

## Where to Add New Code

**New Admin Entity (complete checklist):**

1. **Type definitions** → `packages/types/src/admin/{entity}/index.ts`
   - Define `AdminEntityListPrismaQuery` and `AdminEntityListPrismaType`
   - Define `ENTITY_FIELD_CONFIG` and `ENTITY_SORT_FIELDS`

2. **Zod schemas** → `packages/schemas/src/admin/{entity}/`
   - Create folder
   - Define base schema, query schema (via `createDataQuerySchema()`), save schema, export schema
   - Pattern: `{entity}-zod-schema.ts`

3. **Backend DTOs** → `apps/backend/src/app/admin/{entity}/dto/`
   - Create `{entity}-query.dto.ts`
   - Create `{entity}-lookup-query.dto.ts`
   - Create `{entity}-export-query.dto.ts`
   - Create `{entity}-save.dto.ts` (if create/update endpoint exists)

4. **Backend service** → `apps/backend/src/app/admin/{entity}/{entity}.service.ts`
   - Implement `get{Entities}(query)` for paginated list
   - Implement `*iterate{Entities}()` for export iterator
   - Implement `lookup()` for selection inputs
   - Implement `get{Entity}ById()` if needed
   - Implement `save{Entity}()` if create/update needed

5. **Backend controller** → `apps/backend/src/app/admin/{entity}/{entity}.controller.ts`
   - POST `/admin/{entity}/query` endpoint
   - GET `/admin/{entity}/lookup` endpoint
   - GET `/admin/{entity}/export` endpoint
   - POST `/admin/{entity}/save` or GET `/admin/{entity}/:id` if needed

6. **Export config** → `apps/backend/src/app/admin/{entity}/{entity}.export-config.ts`
   - Define `ENTITY_EXPORT_COLUMNS` array with column definitions

7. **Backend module** → `apps/backend/src/app/admin/{entity}/{entity}.module.ts`
   - Register controller and service
   - Import PrismaModule

8. **Register in admin module** → `apps/backend/src/app/admin/admin.module.ts`
   - Add `{Entity}Module` to imports

9. **Frontend page** → `apps/web/app/(admin)/admin/{entities}/page.tsx`
   - DataTable with columns, datasource, translations
   - Reference: `apps/web/app/(admin)/admin/customers/page.tsx`

10. **Prisma schema** → `packages/prisma/prisma/schema/{entity}.prisma`
    - Define model with relations, indexes

**New Utility Function:**
- Shared backend: `apps/backend/src/core/utils/{name}.ts`
- Shared frontend: `apps/web/core/lib/{name}.ts`
- Shared package: `packages/utils/src/{name}.ts`

**New Shared Hook (frontend):**
- Location: `apps/web/core/hooks/use{Feature}.ts`
- Should wrap useQuery or useMutation from React Query
- Use `DATA_ACCESS_KEYS` from `@org/constants`

**New Component (frontend):**
- Reusable: `packages/ui/src/{feature}/` folder with `index.tsx` barrel export
- Page-specific: `apps/web/app/(route-group)/path/components/{ComponentName}.tsx`
- Mark with `'use client'` if using hooks or interactivity

## Special Directories

**`packages/prisma/src/generated/prisma`:**
- Purpose: Generated Prisma client (output of `npx prisma generate`)
- Generated: Yes (from `prisma/schema/`)
- Committed: No (.gitignore'd)
- Never edit manually

**`apps/backend/dist`** and **`apps/web/dist`**:
- Purpose: Build output
- Generated: Yes (from build step)
- Committed: No
- Contains: Bundled/compiled code

**`.nx/cache`:**
- Purpose: Nx distributed caching
- Generated: Yes
- Committed: No

**`packages/prisma/prisma/migrations/`:**
- Purpose: Database migration files
- Generated: Yes (from `npx prisma migrate dev`)
- Committed: Yes (migrations are version-controlled)

---

*Structure analysis: 2026-02-27*
