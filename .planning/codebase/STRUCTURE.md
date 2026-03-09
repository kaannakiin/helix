# Codebase Structure

**Analysis Date:** 2026-03-09

## Directory Layout

```
helix/
├── apps/
│   ├── backend/                # NestJS REST API (port 3003)
│   ├── portal/                 # Next.js admin dashboard (port 3000)
│   ├── storefront-router/      # Fastify domain router (port 3100)
│   ├── b2c-storefront/         # Next.js B2C storefront (port 3200) [scaffold]
│   ├── b2b-storefront/         # Next.js B2B storefront (port 3300) [scaffold]
│   └── backend-e2e/            # Playwright E2E tests for backend
├── packages/
│   ├── prisma/                 # Prisma ORM — schema, migrations, generated client
│   ├── schemas/                # Zod validation schemas (shared frontend + backend)
│   ├── types/                  # TypeScript type definitions and Prisma query helpers
│   ├── constants/              # Shared constants (auth, enums, routes, data keys)
│   ├── ui/                     # Reusable React/Mantine UI components
│   ├── i18n/                   # Internationalization — locale files, paths, types
│   ├── hooks/                  # Shared React hooks (useTranslatedZodResolver)
│   └── utils/                  # Shared utility functions (HTTP clients, slugify, dates)
├── docker/                     # Docker-related files
├── Caddyfile                   # Reverse proxy config (TLS, admin/storefront routing)
├── docker-compose.yml          # Full stack: Postgres, Redis, MinIO, all apps
├── nx.json                     # Nx workspace configuration
├── package.json                # Root workspace manifest
├── tsconfig.base.json          # Shared TypeScript config
├── eslint.config.mjs           # Shared ESLint config
├── jest.config.ts              # Root Jest config
└── jest.preset.js              # Jest preset for all projects
```

## Directory Purposes

**`apps/backend/`:**
- Purpose: NestJS REST API serving admin and storefront endpoints
- Contains: Modules organized by domain, core utilities, decorators, pipes, interceptors
- Key files:
  - `src/main.ts` — Bootstrap, CORS, Swagger, global prefix
  - `src/app/app.module.ts` — Root module importing all feature modules
  - `src/app/admin/admin.module.ts` — Admin feature module aggregator
  - `src/app/admin/{domain}/{domain}.controller.ts` — REST endpoints
  - `src/app/admin/{domain}/{domain}.service.ts` — Business logic
  - `src/app/admin/{domain}/dto/index.ts` — Zod-based DTOs
  - `src/core/utils/prisma-query-builder.ts` — Generic filter/sort -> Prisma query
  - `src/core/decorators/` — `@Public()`, `@CurrentUser()`, `@ContentLocale()`, `@Locale()`, `@AuthSurface()`
  - `src/core/pipes/file-validation.pipe.ts` — File upload validation
  - `src/core/interceptors/content-locale.interceptor.ts` — Extracts content locale from headers
  - `src/core/services/cors-origin.service.ts` — Dynamic CORS origin validation
  - `src/app/prisma/` — PrismaService (database)
  - `src/app/redis/` — RedisModule (caching/queues)
  - `src/app/upload/` — UploadService (MinIO file storage)
  - `src/app/export/` — ExportService (Excel/CSV generation)
  - `src/app/i18n/` — i18n filters for error translation
  - `src/app/geolocation/` — IP geolocation module

**`apps/portal/`:**
- Purpose: Next.js admin dashboard (App Router)
- Contains: Pages, core infrastructure (providers, stores, hooks, lib, i18n)
- Key files:
  - `app/layout.tsx` — Root layout (providers chain)
  - `app/(auth)/auth/` — Login/register pages
  - `app/(admin)/layout.tsx` — Admin shell layout
  - `app/(admin)/{resource}/page.tsx` — List pages (DataTable)
  - `app/(admin)/{resource}/[id]/page.tsx` — Detail/edit pages (forms)
  - `core/lib/api/api-client.ts` — Client-side API client (with auto-refresh)
  - `core/lib/api/server-fetch.ts` — Server-side fetch (cookie forwarding)
  - `core/lib/api/api-base-url.ts` — API URL resolution
  - `core/lib/api/api-error.ts` — API error class
  - `core/lib/api/download.ts` — Export download helper
  - `core/lib/prefetch.ts` — React Query prefetch utilities
  - `core/lib/query-client.ts` — React Query client config
  - `core/lib/theme.tsx` — Mantine theme customization
  - `core/providers/auth-provider.tsx` — Hydrates auth store from server headers
  - `core/providers/query-provider.tsx` — React Query provider
  - `core/providers/locale-provider.tsx` — Locale context
  - `core/stores/auth.store.ts` — Zustand auth state (user, login, logout)
  - `core/hooks/useAdmin{Resource}.ts` — React Query hooks per resource
  - `core/hooks/useAuth.ts` — Auth hook
  - `core/hooks/useImageUpload.ts` — Image upload hook
  - `core/i18n/request.ts` — next-intl config (loads validation + portal messages)
  - `core/ui/components/admin-layout/admin-shell.tsx` — Admin sidebar/header shell
  - `core/config/` — App configuration

**`apps/storefront-router/`:**
- Purpose: Fastify reverse proxy for multi-tenant storefront routing
- Contains: Plugins for routing, caching, health checks
- Key files:
  - `src/main.ts` — Fastify server bootstrap
  - `src/plugins/router-plugin.ts` — Domain resolution, header injection, http-proxy forwarding
  - `src/plugins/resolve-cache.ts` — TTL cache for domain -> store resolution
  - `src/plugins/upstream-health.ts` — Health monitoring for B2C/B2B upstreams
  - `src/plugins/health-plugin.ts` — Health check endpoint

**`apps/b2c-storefront/`:**
- Purpose: B2C customer-facing storefront (early scaffold)
- Contains: Minimal Next.js app with layout, page, i18n config
- Key files: `src/app/layout.tsx`, `src/app/page.tsx`, `core/i18n/request.ts`

**`apps/b2b-storefront/`:**
- Purpose: B2B customer-facing storefront (early scaffold)
- Contains: Minimal Next.js app with layout, page, i18n config
- Key files: `app/layout.tsx`, `app/page.tsx`, `core/i18n/request.ts`

**`packages/prisma/`:**
- Purpose: Database schema, migrations, and generated Prisma client
- Contains: Multi-file schema, migration history, generated client
- Key files:
  - `prisma/schema/` — 26 `.prisma` schema files (one per domain: `product.prisma`, `store.prisma`, etc.)
  - `prisma/schema/base.prisma` — Datasource and generator config
  - `prisma/schema/enums.prisma` — All enum definitions
  - `prisma/migrations/` — SQL migration files
  - `generated/prisma/` — Generated Prisma client (committed)

**`packages/schemas/`:**
- Purpose: Zod validation schemas shared between frontend forms and backend DTOs
- Contains: Schemas organized by domain, common building blocks, validation keys
- Key files:
  - `src/common/common-schemas.ts` — Shared schema primitives (slug, cuid, dropzone, image, etc.)
  - `src/common/validation-keys.ts` — `V` constant object mapping validation error keys
  - `src/admin/{domain}/{domain}-zod-schema.ts` — Domain schemas following Base/Frontend/Backend pattern

**`packages/types/`:**
- Purpose: TypeScript types and Prisma query include/select helpers
- Contains: Types organized by domain, mirroring backend module structure
- Key files:
  - `src/admin/{domain}/index.ts` — Prisma query helpers (e.g., `adminProductListPrismaQuery()`) and inferred types
  - `src/pagination/index.ts` — `PaginatedResponse<T>` type
  - `src/data-query/index.ts` — `FilterCondition`, `SortCondition`, `SearchParam` types
  - `src/token/index.ts` — `TokenPayload` type
  - `src/export/index.ts` — Export-related types

**`packages/constants/`:**
- Purpose: Shared constants used across all apps
- Contains: Auth constants, enum configs, data keys, route constants
- Key files:
  - `src/auth-constants/index.ts` — Cookie names, token settings
  - `src/enum-configs/index.ts` — Enum display configs (colors, labels) with `buildColorMap()`, `buildEnumOptions()`
  - `src/data-keys/index.ts` — React Query data keys (`DATA_ACCESS_KEYS`)
  - `src/routes-constants/index.ts` — Route path constants
  - `src/product-constants/index.ts` — Product-specific constants

**`packages/ui/`:**
- Purpose: Reusable React components built on Mantine
- Contains: DataTable (ag-grid wrapper), Dropzone, form inputs, app shells, decision tree
- Key files:
  - `src/data-table/` — Full data table system (components, hooks, context, store, types, utils)
  - `src/dropzone/` — File upload dropzone
  - `src/inputs/` — Custom form inputs (rich text, phone, cron, search, relation selectors)
  - `src/appshells/` — Application shell layouts
  - `src/decision-tree/` — Decision tree visualization (React Flow based)
  - `src/terminal-log/` — Terminal-style log display

**`packages/i18n/`:**
- Purpose: Internationalization — locale files and configuration
- Contains: JSON locale files, path helpers, type definitions
- Key files:
  - `src/locales/{locale}/validation.json` — Validation error messages
  - `src/locales/{locale}/portal.json` — Portal UI translations
  - `src/paths.ts` — Supported locales list, default locale, locale file path resolver
  - `src/types/messages.ts` — `PortalMessages` type definition
  - `src/index.ts` — Public exports

**`packages/hooks/`:**
- Purpose: Shared React hooks
- Key files:
  - `src/useTranslatedZodResolver.ts` — Zod resolver that translates validation error keys via i18n

**`packages/utils/`:**
- Purpose: Shared utility functions
- Key files:
  - `src/lib/http/create-api-client.ts` — Client-side fetch wrapper with auto-refresh
  - `src/lib/http/create-server-fetch.ts` — Server-side fetch wrapper with cookie forwarding
  - `src/lib/slugify.ts` — Slug generation
  - `src/lib/date-transformer.ts` — Date utilities
  - `src/lib/products/` — Product-specific utilities

## Key File Locations

**Entry Points:**
- `apps/backend/src/main.ts`: Backend API bootstrap
- `apps/portal/app/layout.tsx`: Portal root layout
- `apps/storefront-router/src/main.ts`: Storefront router bootstrap
- `apps/b2c-storefront/src/app/layout.tsx`: B2C root layout
- `apps/b2b-storefront/app/layout.tsx`: B2B root layout

**Configuration:**
- `nx.json`: Nx workspace plugins and target defaults
- `tsconfig.base.json`: Shared TypeScript paths and settings
- `eslint.config.mjs`: Shared ESLint rules
- `Caddyfile`: Reverse proxy routing rules
- `docker-compose.yml`: Full infrastructure stack definition
- `apps/portal/next.config.js`: Portal Next.js config (Nx + next-intl)
- `apps/backend/webpack.config.js`: Backend webpack config (if exists)

**Core Logic:**
- `apps/backend/src/app/admin/`: All admin domain modules
- `apps/backend/src/core/utils/prisma-query-builder.ts`: Generic Prisma query builder
- `apps/portal/core/hooks/`: All React Query hooks for API data
- `apps/portal/core/lib/api/`: API client infrastructure
- `packages/schemas/src/`: All validation schemas

**Testing:**
- `apps/backend-e2e/`: Playwright E2E tests
- `jest.config.ts` / `jest.preset.js`: Jest configuration

## Naming Conventions

**Files:**
- NestJS modules: `kebab-case.{module|controller|service|guard|strategy|pipe|interceptor|filter|decorator}.ts` (e.g., `products.controller.ts`)
- DTOs: `dto/index.ts` barrel file per module
- Next.js pages: `page.tsx` (App Router convention)
- Next.js layouts: `layout.tsx`
- React components: `PascalCase.tsx` or `kebab-case.tsx` (mixed)
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useAdminProducts.ts`)
- Schemas: `{domain}-zod-schema.ts` (e.g., `category-zod-schema.ts`)
- Types: `index.ts` in domain directories
- Constants: `kebab-case/index.ts`

**Directories:**
- Backend modules: `kebab-case` matching domain name (e.g., `customer-groups/`, `price-lists/`)
- Portal routes: Next.js App Router conventions with route groups `(auth)`, `(admin)`, dynamic `[id]`
- Package organization: `kebab-case` (e.g., `data-table/`, `rich-text-editor/`)

## Where to Add New Code

**New Admin Resource (full-stack):**
1. Schema: `packages/schemas/src/admin/{resource}/{resource}-zod-schema.ts` — follow BaseFooSchema + FooSchema + BackendFooSchema pattern from `packages/schemas/src/admin/categories/category-zod-schema.ts`
2. Types: `packages/types/src/admin/{resource}/index.ts` — Prisma query helpers and inferred types
3. Backend module: `apps/backend/src/app/admin/{resource}/` — create `{resource}.module.ts`, `{resource}.controller.ts`, `{resource}.service.ts`, `dto/index.ts`
4. Register module in `apps/backend/src/app/admin/admin.module.ts`
5. Portal list page: `apps/portal/app/(admin)/{resource}/page.tsx` — use DataTable with datasource pattern
6. Portal detail page: `apps/portal/app/(admin)/{resource}/[id]/page.tsx` — use form with `useTranslatedZodResolver`
7. Portal hooks: `apps/portal/core/hooks/useAdmin{Resource}.ts` — React Query hooks
8. i18n keys: Add keys to `packages/i18n/src/locales/{locale}/portal.json` and `packages/i18n/src/locales/{locale}/backend.json`
9. Constants: Add data keys to `packages/constants/src/data-keys/index.ts`

**New Shared UI Component:**
- Implementation: `packages/ui/src/{component-name}/`
- Export from: `packages/ui/src/index.ts` (if barrel exists) or directly import from path

**New Shared Hook:**
- Implementation: `packages/hooks/src/{hookName}.ts`
- Export from: `packages/hooks/src/index.ts`

**New Utility Function:**
- Shared helpers: `packages/utils/src/lib/{category}/{function}.ts`
- HTTP utilities: `packages/utils/src/lib/http/`

**New Prisma Model:**
- Schema: `packages/prisma/prisma/schema/{model}.prisma`
- Enums: `packages/prisma/prisma/schema/enums.prisma`
- After changes: Run `npx prisma generate` and `npx prisma migrate dev`

**New Validation Schema:**
- Schema file: `packages/schemas/src/admin/{domain}/{domain}-zod-schema.ts`
- Validation keys: Add to `packages/schemas/src/common/validation-keys.ts`
- Common building blocks: Reuse from `packages/schemas/src/common/common-schemas.ts`

**New i18n Translations:**
- Validation messages: `packages/i18n/src/locales/{locale}/validation.json`
- Backend error messages: `packages/i18n/src/locales/{locale}/backend.json`
- Portal UI text: `packages/i18n/src/locales/{locale}/portal.json`
- Currently supported locales: `en`, `tr`

**New Backend Decorator/Pipe/Interceptor:**
- Decorators: `apps/backend/src/core/decorators/`
- Pipes: `apps/backend/src/core/pipes/`
- Interceptors: `apps/backend/src/core/interceptors/`
- Export from barrel: `apps/backend/src/core/decorators/index.ts`

## Special Directories

**`packages/prisma/generated/`:**
- Purpose: Auto-generated Prisma client
- Generated: Yes (by `prisma generate`)
- Committed: Yes

**`apps/*/dist/` and `apps/*/.next/`:**
- Purpose: Build output
- Generated: Yes
- Committed: No

**`node_modules/`:**
- Purpose: Dependencies (npm workspaces)
- Generated: Yes
- Committed: No

**`.planning/`:**
- Purpose: GSD planning and codebase analysis documents
- Generated: By analysis tools
- Committed: Yes

**`docker/`:**
- Purpose: Docker-related configuration files
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-03-09*
